// 顶点着色器程序
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 坐标
    attribute vec2 a_TexCoord; // 纹理坐标
    uniform mat4 u_MvpMatrix; // 模型视图矩阵
    varying vec2 v_TexCoord; // 纹理(传递给片元着色器)
    void main () {
        gl_Position = u_MvpMatrix * a_Position;
        v_TexCoord = a_TexCoord;
    }
`;
// 片元着色器程序
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float; // 指定默认精度
    #endif
    uniform sampler2D u_Sampler; // 取样器
    varying vec2 v_TexCoord; // 纹理坐标(从顶点着色器传递过来)
    void main () {
        gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }
`;

/**
 * @method 页面加载完成事件
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
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize the shaders');
        return;
    }
    // 设置顶点缓冲
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set vertex information');
        return;
    }
    // 设置清除色和深度缓冲
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // 获取uniform变量
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of uniform');
        return;
    }
    // 创建透视投影矩阵
    var viewProjMatrx = new Matrix4();
    viewProjMatrx.setPerspective(30.0, canvas.width/canvas.height, 1, 100); // 设置透视投影
    viewProjMatrx.lookAt(3.0,3.0,7.0,  0.0,0.0,0.0,  0.0,1.0,0.0); // 设置视点
    // 注册事件处理器
    var currentAngle = [0.0, 0.0] // 当前旋转角度
    initEventHandlers(canvas, currentAngle);
    // 设置纹理
    if (!initTextures(gl)) {
        console.log('Failed to initialize the texture');
        return;
    }
    // 创建循环函数
    var tick = function () {
        draw(gl, n, viewProjMatrx, u_MvpMatrix, currentAngle);
        requestAnimationFrame(tick, canvas);
    };
    tick();
}

/**
 * @method 设置顶点缓冲
 * @param gl
 * @returns {number}
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
    var vertices = new Float32Array([   // Vertex coordinates
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
         1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
         1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);

    var texCoords = new Float32Array([   // Texture coordinates
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // 创建索引缓冲
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create index buffer object');
        return;
    }
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) {
        return -1;
    }
    if (!initArrayBuffer(gl, texCoords, 2, gl.FLOAT, 'a_TexCoord')) {
        return -1;
    }

    // 解除绑定的缓冲对象
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    // 将index数据写入缓冲
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

// 初始化事件处理
function initEventHandlers(canvas, currentAngle) {
    var dragging = false; // 是否可以拖动
    var lastX = -1, lastY = -1; // 最后一次的x,y 坐标

    // 绑定down事件
    canvas.onmousedown = function (event) {
        var x = event.clientX, y = event.clientY;
        var rect = event.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    }
    // 绑定up事件
    canvas.onmouseup = function (event) {
        dragging = false;
    }
    // 绑定move事件
    canvas.onmousemove = function (event) {
        var x = event.clientX, y = event.clientY;
        if (dragging) {
            var factor = 100/canvas.height; // 旋转英子
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);

            // 限制x-axis的旋转角度在-90到90之间
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90), -90);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x;
        lastY = y;
    }
}

var g_MvpMatrix = new Matrix4(); // 模型视图矩阵
// 绘制
function draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle) {
    g_MvpMatrix.set(viewProjMatrix);
    g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // 绕x坐标轴旋转
    g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // 绕y坐标轴旋转
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

// 初始化ArrayBuffer
function initArrayBuffer(gl, data, num, type, attribute) {
    // 创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // 将数据写入缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 将缓冲区分配给attribute变量
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_Attribute);

    return true;
}

// 初始化纹理数据
function initTextures(gl) {
    // 创建纹理对象
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    // 获得取样器的存储地址
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }
    // 创建图片对象
    var image = new Image();
    // 设置图片加载完成处理事件
    image.onload = function () {
        loadTexture(gl, texture, u_Sampler, image);
    }
    image.src = '../resources/flower.png';

    return true;
}
// 加载纹理
function loadTexture(gl, texture, u_Sampler, image) {
    // 对纹理进行y轴反转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 开启0号纹理对象
    gl.activeTexture(gl.TEXTURE0);
    // 向target绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // 将0号纹理传递给着色器
    gl.uniform1i(u_Sampler, 0);
}