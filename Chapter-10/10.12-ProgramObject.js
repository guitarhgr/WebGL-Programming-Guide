/** 如何切换着色器思路：
 *       1. 准备用来绘制单色立方体的着色器。
 *       2. 准备用来绘制纹理立方体的着色器。
 *       3. 调用createProgram()函数，利用第1步创建出的着色器，创建着色器程序对象。
 *       4. 调用createProgram()函数，利用第2步创建出的着色器，创建着色器程序对象。
 *       5. 调用gl.useProgram()函数，指定使用第3步创建出的着色器程序对象。
 *       6. 通过缓冲区对象向着色器中传入attribute变量并开启。
 *       7. 绘制单色立方体。
 *       8. 调用gl.useProgram()函数，指定使用第4步创建出的着色器程序对象。
 *       9. 通过缓冲区对象向着色器attribute变量并开启之。
 *      10. 绘制纹理立方体。
 */

// 顶点着色器_绘制单色立方体
var SOLID_VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    varying vec4 v_Color;
    void main () {
        vec3 lightDirection = vec3(0.0, 0.0, 1.0);
        vec4 color = vec4(0.0, 1.0, 1.0, 1.0);
        gl_Position = u_MvpMatrix * a_Position;
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        float nDotL = max(dot(normal, lightDirection), 0.0);
        v_Color = vec4(color.rgb * nDotL, color.a);
    }
`;

// 片元着色器_绘制单色立方体
var SOLID_FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    varying vec4 v_Color;
    void main () {
        gl_FragColor = v_Color;
    }
`;

// 顶点着色器_绘制纹理立方体
var TEXTURE_VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    attribute vec2 a_TexCoord;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    varying float v_NdotL;
    varying vec2 v_TexCoord;
    void main () {
        vec3 lightDirection = vec3(0.0, 0.0, 1.0);
        gl_Position = u_MvpMatrix * a_Position;
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        v_NdotL = max(dot(normal, lightDirection), 0.0);
        v_TexCoord = a_TexCoord;
    }
`;
// 片元着色器_绘制纹理立方体
var TEXTURE_FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord;
    varying float v_NdotL;
    void main () {
        vec4 color = texture2D(u_Sampler, v_TexCoord);
        gl_FragColor = vec4(color.rgb * v_NdotL, color.a);
    }
`;

/**
 * @method 页面加载完成方法
 */
function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // 初始化着色器
    var solidProgram = createProgram(gl, SOLID_VSHADER_SOURCE, SOLID_FSHADER_SOURCE);
    var texProgram   = createProgram(gl, TEXTURE_VSHADER_SOURCE, TEXTURE_FSHADER_SOURCE);
    if (!solidProgram || !texProgram) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // 获取着色器中的变量的存储地址
    solidProgram.a_Position     = gl.getAttribLocation(solidProgram, 'a_Position');
    solidProgram.a_Normal       = gl.getAttribLocation(solidProgram, 'a_Normal');
    solidProgram.u_MvpMatrix    = gl.getUniformLocation(solidProgram, 'u_MvpMatrix');
    solidProgram.u_NormalMatrix = gl.getUniformLocation(solidProgram, 'u_NormalMatrix');

    texProgram.a_Position       = gl.getAttribLocation(texProgram, 'a_Position');
    texProgram.a_Normal         = gl.getAttribLocation(texProgram, 'a_Normal');
    texProgram.a_TexCoord       = gl.getAttribLocation(texProgram, 'a_TexCoord');
    texProgram.u_MvpMatrix      = gl.getUniformLocation(texProgram, 'u_MvpMatrix');
    texProgram.u_NormalMatrix   = gl.getUniformLocation(texProgram, 'u_NormalMatrix');
    texProgram.u_Sampler        = gl.getUniformLocation(texProgram, 'u_Sampler');

    if (!checkGetStorageLocation(solidProgram)) return;
    if (!checkGetStorageLocation(texProgram)) return;

    // 设置顶点缓冲
    var cube = initVertexBuffers(gl);
    if (!cube) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 设置纹理
    var texture = initTexTures(gl, texProgram);
    if (!texture) {
        console.log('Failed to initialize the texture');
        return;
    }

    // 设置清除颜色和深度测试(清除隐藏面)
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // 计算透视投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0,0.0,15.0,  0.0,0.0,0.0,  0.0,1.0,0.0);

    // 开始绘制
    var currentAngle = 0.0;
    var tick = function () {
        // 计算当前角度
        currentAngle = animate(currentAngle);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 绘制立方体
        drawSolidCube(gl, solidProgram, cube, -2.0, currentAngle, viewProjMatrix);
        drawTexCube(gl, texProgram, cube, texture, 2.0, currentAngle, viewProjMatrix);
        window.requestAnimationFrame(tick);
    }

    tick();
}

/**
 * @method 检查是否获取到着色器中的变量的存储地址
 * @param program
 * @returns {boolean}
 */
function checkGetStorageLocation(program) {
    for (let k in program) {
        // a_attribute
        if (k.indexOf('a_') > 0 && program[k] < 0) {
            console.log('Failed to get storage location of attribute variable');
            return false;
        }
        // u_uniform
        else if (k.indexOf('u_') > 0 && !program[k]) {
            console.log('Failed to get storage location of uniform variable');
            return false;
        }
    }

    return true;
}

/**
 * @method 设置顶点缓冲数据并返回
 * @param gl {Object} WebGL渲染上下文
 * @returns {*} 绑定了创建的缓冲的对象
 */
function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    // 顶点
    var vertices = new Float32Array([   // Vertex coordinates
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
         1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
         1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);

    // 法向量
    var normals = new Float32Array([   // Normal
         0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,     // v0-v1-v2-v3 front
         1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,     // v0-v3-v4-v5 right
         0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,     // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,     // v1-v6-v7-v2 left
         0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,     // v7-v4-v3-v2 down
         0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0      // v4-v7-v6-v5 back
    ]);

    // 纹理坐标
    var texCoords = new Float32Array([   // Texture coordinates
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    // 顶点索引
    var indices = new Uint8Array([        // Indices of the vertices
         0, 1, 2,   0, 2, 3,    // front
         4, 5, 6,   4, 6, 7,    // right
         8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    var o = new Object();

    // 创建缓冲
    o.vertexBuffer   = initArrayBufferForLaterUse(gl, vertices, 3, gl.FLOAT);
    o.normalBuffer   = initArrayBufferForLaterUse(gl, normals, 3, gl.FLOAT);
    o.texCoordBuffer = initArrayBufferForLaterUse(gl, texCoords, 2, gl.FLOAT);
    o.indexBuffer    = initElementArrayBufferForLaterUse(gl, indices, gl.UNSIGNED_BYTE);

    if (!o.vertexBuffer || !o.normalBuffer || !o.texCoordBuffer || !o.indexBuffer) return null;

    o.numIndices = indices.length;

    // 解除绑定buffer对象
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    return o;
}

/**
 * @method 初始化纹理并返回
 * @param gl {Object} WebGL渲染上下文
 * @param program {Object} 着色器程序对象
 * @returns {*} 纹理对象
 */
function initTexTures(gl, program) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return null;
    }
    // 创建一张图片
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return null;
    }

    // 注册图片加载完成事件
    image.onload = function () {
        // 图片y轴翻转
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        // 激活纹理
        gl.activeTexture(gl.TEXTURE0);
        // 绑定纹理
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // 配置纹理参数
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        // 配置纹理图像
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        // 使用着色器程序
        gl.useProgram(program);
        gl.uniform1i(program.u_Sampler, 0);

        // 解除纹理绑定
        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    image.src = '../resources/orange.jpg';

    return texture;
}

/**
 * @method 绘制立方体
 * @param gl {Object} WebGL渲染上下文
 * @param program {Object} 渲染程序对象
 * @param o {Object} 包含了顶点缓冲数据的对象
 * @param x {Number} x轴坐标位置
 * @param angle {Number} 旋转角度
 * @param viewProjMatrix {Matrix4} 模型视图矩阵
 */
function drawSolidCube(gl, program, o, x, angle, viewProjMatrix) {
    // 告诉WebGL使用这个程序对象
    gl.useProgram(program);

    // 分配缓冲区对象并开启attribute变量
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    // 绘制
    drawCube(gl, program, o, x, angle, viewProjMatrix);
}

/**
 * @method 绘制纹理立方体
 * @param gl {Object} WebGL渲染上下文
 * @param program {Object} 着色器程序对象
 * @param o {Object} 包含了顶点缓冲数据的对象
 * @param texture {Object} 纹理对象
 * @param x {Number} x轴坐标位置
 * @param angle {Number} 旋转角度
 * @param viewProjMatrix {Matrix4} 模型视图矩阵
 */
function drawTexCube(gl, program, o, texture, x, angle, viewProjMatrix,) {
    // 告诉WebGL使用这个程序对象
    gl.useProgram(program);

    // 分配缓冲区对象并开启attribute变量
    initAttributeVariable(gl, program.a_Position, o.vertexBuffer);
    initAttributeVariable(gl, program.a_Normal, o.normalBuffer);
    initAttributeVariable(gl, program.a_TexCoord, o.texCoordBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, o.indexBuffer);

    // 将纹理对象绑定到0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 绘制
    drawCube(gl, program, o, x, angle, viewProjMatrix);
}

/**
 * @method 分配缓冲区对象并开启attribute变量
 * @param {Object} gl  WebGL渲染上下文
 * @param {Number} a_attribute  attribute变量的存储地址
 * @param {Object} buffer  缓冲对象
 */
function initAttributeVariable(gl, a_attribute, buffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(a_attribute, buffer.num, buffer.type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
}

var g_modelMatrix = new Matrix4(); // 模型矩阵
var g_mvpMatrix = new Matrix4(); // 模型视图矩阵
var g_normalMatrix = new Matrix4(); // 法向量矩阵

/**
 * @method 绘制立方体
 * @param {Object} gl WebGL渲染上下文
 * @param {Object} program 渲染程序对象
 * @param {Object} o 包含了顶点缓冲数据的对象
 * @param {Number} x x轴坐标位置
 * @param {Number} angle 旋转角度
 * @param {Matrix4} viewProjMatrix 模型视图矩阵
 */
function drawCube(gl, program, o, x, angle, viewProjMatrix) {
    // 计算模型矩阵
    g_modelMatrix.setTranslate(x, 0.0, 0.0);
    g_modelMatrix.rotate(20.0, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);

    // 计算法向量的逆矩阵和转置矩阵
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

    // 计算视图矩阵，并传递给u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    gl.drawElements(gl.TRIANGLES, o.numIndices, o.indexBuffer.type, 0);
}

/**
 * @method 初始化缓冲但不绑定attribute变量，不开启
 * @param {Object} gl WebGL渲染上下文
 * @param {Float32Array} data 数据
 * @param {Number} num 缓冲区中每个顶点的分量个数
 * @param {Number} type 数据格式
 * @returns {*} 缓冲区对象
 */
function initArrayBufferForLaterUse(gl, data, num, type) {
    // 创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // 绑定缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据传入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.num = num;
    buffer.type = type;

    return buffer;
}

/**
 * @method 初始化ElementArray缓冲
 * @param {Object} gl WebGL渲染上下文
 * @param {Float32Array} data 数据
 * @param {Number} type 数据格式
 * @returns {*} ElementArray缓冲
 */
function initElementArrayBufferForLaterUse(gl, data, type) {
    // 创建缓冲
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }

    // 绑定缓冲
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    // 将数据传递个缓冲
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

    buffer.type = type;

    return buffer;
}

var ANGLE_STEP = 30; // 旋转角度间隔
var last = Date.now();

/**
 * @method 计算角度
 * @param {Number} angle 上一次的角度
 * @returns {number} 当前角度
 */
function animate(angle) {
    var now = Date.now();
    var elapsed = now - last;
    last = now;

    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}
