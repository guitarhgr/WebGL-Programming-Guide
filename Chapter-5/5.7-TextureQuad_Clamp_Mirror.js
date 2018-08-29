// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    void main () {
        gl_Position = a_Position;
        v_TexCoord = a_TexCoord;
    }
`
// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    uniform sampler2D u_Sampler;
    varying vec2 v_TexCoord;
    void main () {
        gl_FragColor = texture2D(u_Sampler, v_TexCoord);
    }
`

function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置顶点数据
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to initialize the vertex object');
        return;
    }

    // 设置canvas的清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 设置纹理信息
    if (!initTextures(gl, n)) {
        console.log('Failed to initialize the textures');
        return;
    }
}

/**
 * 设置顶点数据
 * @param gl WebGL渲染上下文
 * @returns {number} 定点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据的浮点类数组
    var verticesTexCoords = new Float32Array([
        -0.5,  0.5, -0.3,  1.7,
        -0.5, -0.5, -0.3, -0.2,
         0.5,  0.5,  1.7,  1.7,
         0.5, -0.5,  1.7, -0.2
    ]);

    var n = 4; // 顶点数量
    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // 将buffer绑定到缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
    // 每一个字节的大小
    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
    // 获取顶点着色器中的位置变量，并分配缓冲区，开启
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);
    // 获取顶点着色器中的纹理坐标变量，并分配缓冲区，开启
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return -1;
    }
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2);
    gl.enableVertexAttribArray(a_TexCoord);

    return n;
}

/**
 * 设置纹理信息
 * @param gl WebGL渲染上下文
 * @param n 顶点数量
 * @returns {boolean} 是否初始化完成
 */
function initTextures(gl, n) {
    // 创建纹理对象
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    // 获取u_Sampler[取样器]在内存中的位置
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }
    // 创建图片对象
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return;
    }
    // 注册图片加载完成事件
    image.onload = function () {
        loadTexture(gl, n, texture, u_Sampler, image); // 纹理加载完成处理方法
    };
    // 设置图片路径
    image.src = '../resources/sky.jpg';
    return true;
}


/**
 * 为WebGL配置纹理
 * @param gl 渲染上下文
 * @param n 顶点数量
 * @param texture 纹理对象
 * @param u_Sampler 取样器地址
 * @param image 图片对象
 */
function loadTexture(gl, n, texture, u_Sampler, image) {
    // 对纹理对象进行y轴翻转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 开始纹理单元
    gl.activeTexture(gl.TEXTURE0);
    // 向target绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    // 将开启的纹理传递给着色器
    gl.uniform1i(u_Sampler, 0);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}