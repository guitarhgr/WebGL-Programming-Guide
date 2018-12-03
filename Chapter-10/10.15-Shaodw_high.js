// 阴影贴图顶点着色器
const SHADOW_VSHADER_SOURCE =
    `
    attribute vec4 a_Position;
    uniform mat4 u_MvpMatrix;
    void main () {
        gl_Position = u_MvpMatrix * a_Position;
    }
`;
// 阴影贴图片元着色器
const SHADOW_FSHADER_SOURCE =
    `
    #ifdef GL_ES
        precision mediump float;
    #endif
    void main () {
        const vec4 bitShift = vec4(1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0);
        const vec4 bitMask = vec4(1.0/256.0, 1.0/256.0, 1.0/256.0, 0.0);
        vec4 rgbaDepth = fract(gl_FragCoord.z * bitShift);
        rgbaDepth -= rgbaDepth.gbaa * bitMask;
        gl_FragColor = vec4(gl_FragCoord.z, 0.0, 0.0, 0.0);
    }
`;

// 正常绘制的顶点着色器
const VSHADER_SOURCE =
    `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_MvpMatrixFromLight;
    varying vec4 v_PositionFromLight;
    varying vec4 v_Color;
    void main () {
        gl_Position = u_MvpMatrix * a_Position;
        v_PositionFromLight = u_MvpMatrixFromLight * a_Position;
        v_Color = a_Color;
    }
`;
// 正常绘制的片元着色器
const FSHADER_SOURCE =
    `
    #ifdef GL_ES
        precision mediump float;
    #endif
    uniform sampler2D u_ShadowMap;
    varying vec4 v_PositionFromLight;
    varying vec4 v_Color;
    float unpackDepth(const in vec4 rgbaDepth) {
        const vec4 bitShift = vec4(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
        float depth = dot(rgbaDepth, bitShift);
        return depth;
    }
    void main () {
        vec3 shadowCoord = (v_PositionFromLight.xyz/v_PositionFromLight.w)/2.0 + 0.5;
        vec4 rgbaDepth = texture2D(u_ShadowMap, shadowCoord.xy);
        float depth = unpackDepth(rgbaDepth);
        float visibility = (shadowCoord.z > depth + 0.005) ? 0.7 : 1.0;
        gl_FragColor = vec4(v_Color.rgb * visibility, v_Color.a);
    }
`;

const OFFSCREEN_WIDTH = 2048, OFFSCREEN_HEIGHT = 2048;
const LIGHT_X = 0, LIGHT_Y = 7, LIGHT_Z = 2;

function main() {
    // 获取canvas元素
    let canvas = document.querySelector('#webgl');

    // 获取WebGL渲染上下文
    let gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
    }

    // 创建阴影渲染程序
    let shadowProgram = createProgram(gl, SHADOW_VSHADER_SOURCE, SHADOW_FSHADER_SOURCE);
    // 获取变量存储地址绑定到渲染程序上面
    shadowProgram.a_Positon   = gl.getAttribLocation(shadowProgram, 'a_Position');
    shadowProgram.u_MvpMatrix = gl.getUniformLocation(shadowProgram, 'u_MvpMatrix');
    // 判断获取是否获取到变量的存储地址
    if (shadowProgram.a_Positon < 0 || !shadowProgram.u_MvpMatrix) {
        console.log('Failed to get the storage location of attribute or uniform');
        return;
    }

    // 创建正常的渲染程序
    let normalProgram = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    // 获取变量存储地址绑定到渲染程序上面
    normalProgram.a_Positon            = gl.getAttribLocation(normalProgram, 'a_Position');
    normalProgram.a_Color              = gl.getAttribLocation(normalProgram, 'a_Color');
    normalProgram.u_MvpMatrix          = gl.getUniformLocation(normalProgram, 'u_MvpMatrix');
    normalProgram.u_MvpMatrixFromLight = gl.getUniformLocation(normalProgram, 'u_MvpMatrixFromLight');
    normalProgram.u_ShadowMap          = gl.getUniformLocation(normalProgram, 'u_ShadowMap');

    if (normalProgram.a_Positon < 0 || normalProgram.a_Color < 0 ||
        !normalProgram.u_MvpMatrix || !normalProgram.u_MvpMatrixFromLight ||
        !normalProgram.u_ShadowMap) {
        console.log('Failed to get the storage location of attribute or uniform');
        return;
    }

    // 设置顶点缓冲
    let triangleBuffer = initVertexBuffersForTriangle(gl); // 设置三角形的顶点缓冲
    let planeBuffer    = initVertexBuffersForPlane(gl); // 设置平面的顶点缓冲
    // 判断是否设置缓冲成功
    if (!triangleBuffer || !planeBuffer) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 初始化帧缓冲
    let fbo = initFramebufferObject(gl);
    if (!fbo) {
        console.log('Failed to initialize frame buffer object');
        return;
    }
    // 设置纹理单元
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fbo.texture);

    // 设置清除颜色和深度缓冲
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);

    // 创建视图透视关照矩阵
    var viewProjMatrixFromLight = new Matrix4();
    viewProjMatrixFromLight.setPerspective(70.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
    viewProjMatrixFromLight.lookAt(LIGHT_X, LIGHT_Y, LIGHT_Z,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0);

    // 创建视图投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(45, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0, 7.0, 9.0,  0.0, 0.0, 0.0,  0.0, 1.0, 0.0);

    var currentAngle = 0.0;
    var mvpMatrixFromLight_t = new Matrix4();
    var mvpMatrixFromLight_p = new Matrix4();
    var tick = function () {
        currentAngle = animate(currentAngle);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(shadowProgram);

        drawTriangle(gl, shadowProgram, triangleBuffer, currentAngle, viewProjMatrixFromLight);
        mvpMatrixFromLight_t.set(g_mvpMatrix);

        drawPlane(gl, shadowProgram, planeBuffer, viewProjMatrixFromLight);
        mvpMatrixFromLight_p.set(g_mvpMatrix);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(normalProgram);
        gl.uniform1i(normalProgram.u_ShadowMap, 0);

        gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_t.elements);
        drawTriangle(gl, normalProgram, triangleBuffer, currentAngle, viewProjMatrix);

        gl.uniformMatrix4fv(normalProgram.u_MvpMatrixFromLight, false, mvpMatrixFromLight_p.elements);
        drawPlane(gl, normalProgram, planeBuffer, viewProjMatrix);

        window.requestAnimationFrame(tick);
    }
    tick();
}

let g_modelMatrix = new Matrix4();
let g_mvpMatrix   = new Matrix4();
function drawTriangle(gl, program, triangle, angle, viewProjMatrix) {
    g_modelMatrix.setRotate(angle, 0, 1, 0);
    draw(gl, program, triangle, viewProjMatrix);
}

function drawPlane(gl, program, plane, viewProjMatrix) {
    g_modelMatrix.setRotate(-45, 0, 1, 1);
    draw(gl, program, plane, viewProjMatrix);
}

function draw(gl, program, o, viewProjMatrix) {
    initAttributeVariable(gl, program.a_Positon, o.vertexBuffer);
    if (program.a_Color != undefined) {
        initAttributeVariable(gl, program.a_Color, o.colorBuffer);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    gl.drawElements(gl.TRIANGLES, o.numIndices, gl.UNSIGNED_BYTE, 0);
}

function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}
function initVertexBuffersForPlane(gl) {
    // Create a plane
    //  v1------v0
    //  |        |
    //  |        |
    //  |        |
    //  v2------v3
    // 顶点
    var vertices = new Float32Array([
        3.0, -1.7, 2.5,  -3.0, -1.7, 2.5,  -3.0, -1.7, -2.5,   3.0, -1.7, -2.5    // v0-v1-v2-v3
    ]);
    // 颜色
    var colors = new Float32Array([
        1.0, 1.0, 1.0,    1.0, 1.0, 1.0,  1.0, 1.0, 1.0,   1.0, 1.0, 1.0
    ]);
    // 顶点索引
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3
    ]);

    // 创建一个对象用来存储缓冲地址
    var o = new Object();

    // 初始化缓冲后面使用
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.colorBuffer  = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
    o.indexBuffer  = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    // 判断初始化缓冲是否成功
    if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) {
        console.log('Failed to create buffer objects');
        return null;
    }

    // 将顶点索引的length绑定到存储缓冲的对象上面
    o.numIndices = indices.length;

    // 解除缓冲绑定
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // 返回存储缓冲地址的对象
    return o;
}

function initVertexBuffersForTriangle(gl) {
    // Create a triangle
    //       v2
    //      / |
    //     /  |
    //    /   |
    //  v0----v1

    // 顶点
    var vertices = new Float32Array([
        -0.8, 3.5, 0.0,  0.8, 3.5, 0.0,  0.0, 3.5, 1.8
    ]);
    // 颜色
    var colors = new Float32Array([
        1.0, 0.5, 0.0,  1.0, 0.5, 0.0,  1.0, 0.0, 0.0
    ]);
    // 顶点索引
    var indices = new Uint8Array([
        0, 1, 2
    ]);

    // 创建一个用来存储缓冲地址的对象
    var o = new Object();

    // 初始化缓冲后面使用
    o.vertexBuffer = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.colorBuffer  = initArrayBufferForLaterUse(gl, colors, 3, gl.FLOAT);
    o.indexBuffer  = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);
    // 判断初始化缓冲是否成功
    if (!o.vertexBuffer || !o.colorBuffer || !o.indexBuffer) {
        console.log('Failed to create vertex information.');
        return null;
    }

    // 将顶点索引的length绑定到存储缓冲的对象上面
    o.numIndices = indices.length;

    // 解除缓冲绑定
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // 返回存储缓冲地址的对象
    return o;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    // 判断是否创建缓冲区成功
    if (!buffer) {
        console.log('Failed to create buffer object');
        return null;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据绑定到缓冲区上面
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 将num和type绑定到缓冲上面
    buffer.num  = num;
    buffer.type = type;

    // 返回缓冲
    return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    // 判断是否创建缓冲区成功
    if (!buffer) {
        console.log('Failed to create buffer object');
        return null;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    // 将数据绑定到缓冲区上面
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 将type绑定到缓冲上面
    buffer.type = type;

    // 返回缓冲
    return buffer;
}

function initFramebufferObject(gl) {
    // 定义变量
    var framebuffer, texture, depthBuffer;

    // 创建错误处理程序
    var error = function () {
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        if (texture) gl.deleteTexture(texture);
        if (depthBuffer) gl.deleteRenderbuffer(depthBuffer);
        return null;
    }

    // 创建帧缓冲
    framebuffer = gl.createFramebuffer();
    // 判断帧缓冲是否创建成功
    if (!framebuffer) {
        console.log('Failed to create framebuffer object');
        return error();
    }

    // 创建纹理
    texture = gl.createTexture();
    // 判断纹理是否创建成功
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }
    // 绑定纹理
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 给纹理绑定图片
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // 创建渲染缓冲
    depthBuffer = gl.createRenderbuffer();
    // 判断渲染缓冲
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }
    // 绑定渲染缓冲
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    // 设置渲染缓冲参数
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    // 绑定帧缓冲
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    // 设置帧缓冲纹理
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    // 设置帧缓冲的渲染缓冲
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // 检查设置帧缓冲是否成功
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (e !== gl.FRAMEBUFFER_COMPLETE) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }
    // 将纹理绑定绑定到帧缓冲上面
    framebuffer.texture = texture;

    // 解除缓冲绑定
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    // 返回帧缓冲
    return framebuffer;
}

// 角度变化间隔
var ANGLE_STEP = 40.0;
// 上一次的时间
var last = Date.now();

function animate(angle) {
    // 当前时间
    var now = Date.now();
    // 时间间隔
    var elapsed = now - last;
    // 赋值上一次时间
    last = now;

    // 当前角度
    var nowAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    // 返回当前角度%360
    return nowAngle % 360;
}