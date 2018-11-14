/**
 * 如何实现渲染到纹理：
 *    需要将纹理对象作为颜色关联对象关联到帧缓冲区对象上，然后在帧缓冲区中进行绘制，此时颜色关联对象(既纹理对象)
 *    就替代了颜色缓冲区。此时仍然需要进行隐藏面消除，所以我们又创建了一个渲染缓冲区对象来作为帧缓冲区的深度关联
 *    对象，以替代深度缓冲区。
 * 步骤：
 *    1. 创建帧缓冲区对象(gl.createFramebuffer()).
 *    2. 创建纹理对象并设置其尺寸和参数(gl.createTexture(), gl.bindTexture(), gl.texIamge2D(), gl.Parameteri()).
 *    3. 创建渲染缓冲区对象(gl.createRenderbuffer()).
 *    4. 绑定渲染缓冲区对象并设置其尺寸(gl.bindRenderbuffer(), gl.renderbufferStorage()).
 *    5. 将帧缓冲区的颜色关联对象指定为一个纹理对象(gl.framebufferTexture2D()).
 *    6. 将帧缓冲区的深度关联对象指定为一个渲染缓冲区对象(gl.framebufferRenderbuffer()).
 *    7. 检查帧缓冲区是否正确配置(gl.checkFramebufferStatur()).
 *    8. 在帧缓冲区中进行绘制(gl.bindFramebuffer()).
 */

// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec2 a_TexCoord; // 纹理坐标
    uniform mat4 u_MvpMatrix;  // 模型视图矩阵
    varying vec2 v_TexCoord;   // 传递的纹理坐标
    void main (){
        gl_Position = u_MvpMatrix * a_Position;
        v_TexCoord = a_TexCoord;
    }
`;
// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    uniform sampler2D u_Sampler; // 取样器
    varying vec2 v_TexCoord; // 纹理坐标
    void main (){
        gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }
`;

// 离屏宽高
var OFFSCREEN_WIDTH  = 256;
var OFFSCREEN_HEIGHT = 256;

function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');

    // 获取WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // 获取attribute和uniform属性的存储位置
    var program = gl.program;
    program.a_Position  = gl.getAttribLocation(program, 'a_Position');
    program.a_TexCoord  = gl.getAttribLocation(program, 'a_TexCoord');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    if (program.a_Position < 0 || program.a_TexCoord < 0 || !program.u_MvpMatrix) {
        console.log('Failed to get the storage location of a_Position, a_TexCoord, u_MvpMatrix');
        return;
    }

    // 设置顶点数据
    var cube  = initVertexBuffersForCube(gl);
    var plane = initVertexBuffersForPlane(gl);
    if (!cube || !plane) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 设置纹理
    var texture = initTextures(gl);
    if (!texture) {
        console.log('Failed to initialize the texture.');
        return;
    }

    // 初始化帧缓冲对象
    var fbo = initFramebufferObject(gl);
    if (!fbo) {
        console.log('Failed to initialize the framebuffer object (FBO)');
        return;
    }

    // 开启深度测试
    gl.enable(gl.DEPTH_TEST);
    // 开启消隐功能(让WebGL不在绘制图形的背面,以提高绘制速度,理想情况下达到两倍),
    // gl.enable(gl.CULL_FACE);

    // 设置透视投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0,0.0,7.0,  0.0,0.0,0.0,  0.0,1.0, 0.0);

    // 创建帧缓冲用到的矩阵
    var viewProjMatrixFBO = new Matrix4();
    viewProjMatrixFBO.setPerspective(30.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);
    viewProjMatrixFBO.lookAt(0.0,2.0,7.0,  0.0,0.0,0.0,  0.0,1.0,0.0);

    // 设置绘制初始角度
    var currentAngle = 0.0;

    // 帧循环
    var tick = function () {
        currentAngle = animate(currentAngle);
        draw(gl, canvas, fbo, plane, cube, currentAngle, texture, viewProjMatrix, viewProjMatrixFBO);
        window.requestAnimationFrame(tick);
    };

    tick();
}

function initVertexBuffersForCube(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    // 顶点
    var vertices = new Float32Array([
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
         1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
         1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);

    // 纹理坐标
    var texCoords = new Float32Array([
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    // 顶点坐标索引
    var indices = new Uint8Array([
         0, 1, 2,   0, 2, 3,    // front
         4, 5, 6,   4, 6, 7,    // right
         8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // 存储创建的缓冲对象
    var o = new Object();

    // 初始化缓冲对象
    o.vertexBuffer   = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer    = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

    if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // 解除绑定的缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initVertexBuffersForPlane(gl) {
    // Create face
    //  v1------v0
    //  |        |
    //  |        |
    //  |        |
    //  v2------v3

    // 顶点坐标
    var vertices = new Float32Array([
        1.0, 1.0, 0.0,  -1.0, 1.0, 0.0,  -1.0,-1.0, 0.0,   1.0,-1.0, 0.0    // v0-v1-v2-v3
    ]);

    // 纹理坐标
    var texCoords = new Float32Array([1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0]);

    // 顶点索引
    var indices = new Uint8Array([0, 1, 2,   0, 2, 3]);

    // 存储创建的缓冲对象
    var o = new Object();

    // 初始化缓冲对象
    o.vertexBuffer   = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer    = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

    if (!o.vertexBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // 解除缓冲绑定
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

function initArrayBufferForLaterUse(gl, data, num, type) {
    // 创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }

    // 把数据写入缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.num  = num;
    buffer.type = type;

    return buffer;
}

function initElementArrayBufferForLaterUse(gl, data, type) {
    // 创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }

    // 将数据写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

function initTextures(gl) {
    // 创建纹理对象
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the Texture object');
        return null;
    }

    // 获得取样器的存储地址
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return null;
    }

    var image = new Image();
    if (!image) {
        console.log('Failed to create the Image object');
        return null;
    }

    image.onload = function () {
        // 对纹理图形进行y轴旋转
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        // 向target绑定纹理对象
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 配置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // 配置纹理图像
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // 将0号纹理传递给着色器
        gl.uniform1i(u_Sampler, 0);

        // 解除纹理对象绑定
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    image.src = '../resources/sky_cloud.jpg';

    return texture;
}

function initFramebufferObject(gl) {
    var framebuffer, texture, depthBuffer;

    var error = function () {
        framebuffer && gl.deleteFramebuffer(framebuffer);
        texture     && gl.deleteTexture(texture);
        depthBuffer && gl.deleteRenderbuffer(depthBuffer);

        return null;
    };

    // 创建帧缓冲对象
    framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
        console.log('Failed to create frame buffer object');
        return error();
    }

    // 创建纹理对象并设置大小等参数
    texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create texture object');
        return error();
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    framebuffer.texture = texture;

    // 创建渲染缓冲区并设置属性
    depthBuffer = gl.createRenderbuffer();
    if (!depthBuffer) {
        console.log('Failed to create renderbuffer object');
        return error();
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    // 检查帧缓冲状态
    var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== e) {
        console.log('Frame buffer object is incomplete: ' + e.toString());
        return error();
    }

    // 解除缓冲绑定
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);

    return framebuffer;
}

function draw(gl, canvas, fbo, plane, cube, angle, texture, viewProjMatrix, viewProjMatrixFBO) {
    // 改变渲染目标为FBO
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    // 设置FBO的视窗大小
    gl.viewport(0, 0, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);

    // 设置清除颜色
    gl.clearColor(0.2, 0.2, 0.4, 1.0);
    // 清除颜色缓冲区和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制纹理几何体
    drawTexturedCube(gl, gl.program, cube, angle, texture, viewProjMatrixFBO);

    // 改变绘制目标
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制平面
    drawTexturedPlane(gl, gl.program, plane, angle, fbo.texture, viewProjMatrix);
}

// 坐标转换矩阵
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();

function drawTexturedCube(gl, program, o, angle, texture, viewProjMatrix) {
    // 计算模型矩阵
    g_modelMatrix.setRotate(20.0,   1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle,  0.0, 1.0, 0.0);

    // 计算模型视图矩阵传递给着色器
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    drawTexturedObject(gl, program, o, texture);
}

function drawTexturedPlane(gl, program, o, angle, texture, viewProjMatrix) {
    // 计算模型矩阵
    g_modelMatrix.setTranslate(0, 0, 1);
    g_modelMatrix.rotate(20.0,  1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle,  0.0, 1.0, 0.0);

    // 计算模型视图矩阵传递给着色器
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    drawTexturedObject(gl, program, o, texture);
}

function drawTexturedObject(gl, program, o, texture) {
    // 设置缓冲开启变量
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);

    // 绑定纹理对象到目标
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 绘制
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);
    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

function drawTexturedCube2(gl, o, angle, texture, viewProjMatrix, u_MvpMatrix) {
    // 计算模型矩阵
    g_modelMatrix.rotate(20.0,  1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle,  0.0, 1.0, 0.0);
    g_modelMatrix.scale(1, 1, 1);

    // 计算模型视图矩阵
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

    drawTexturedObject(gl, o, texture);
}

var ANGLE_STEP = 30.0;

var last = Date.now();
function animate(angle) {
    var now = Date.now();
    var elapsed = now - last;
    last = now;

    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}

/** 划重点：
 *      1. 帧缓冲区对象:
 *          可以用来代替颜色缓冲区或深度缓冲区。绘制在缓冲区中的对象并不会直接显示在<canvas>上，
 *          可以先对帧缓冲区中的内容进行一些处理再显示，或者直接用其中的内容作为纹理图像。
 *     2. 离屏绘制：
 *          在帧缓冲区中进行绘制的过程成为离屏绘制
 *     3. 帧缓冲区所关联的对象：
 *          a. 颜色关联对象
 *          b. 深度关联对象
 *          c. 模板关联对象
 *     4. 每个关联对象又可以分为两种类型：
 *          a. 纹理对象
 *          b. 渲染缓冲区对象
 *
 */

