// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec2 a_TexCoord;
    varying vec2 v_TexCoord;
    void main() {
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
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    varying vec2 v_TexCoord;
    void main () {
        vec4 color0 = texture2D(u_Sampler0, v_TexCoord);
        vec4 color1 = texture2D(u_Sampler1, v_TexCoord);
        gl_FragColor = color0 * color1;
    }
`
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
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置顶点数据
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 设置纹理信息
    if (!initTextures(gl, n)) {
        console.log('Failed to set the textures information');
        return;
    }
}

/**
 * 设置顶点数据到缓冲区
 * @param gl {Object} WebGL渲染上下文
 * @returns {number} 顶点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据的类浮点数组
    var verticesTexCoords = new Float32Array([
        -0.5, 0.5,  0.0, 1.0,
        -0.5,-0.5,  0.0, 0.0,
         0.5, 0.5,  1.0, 1.0,
         0.5,-0.5,  1.0, 0.0
    ]);
    var n = 4; // 顶点数量

    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将数据写入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);
    // 获取字节长度
    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
    // 获取顶点着色器中位置变量，分配buffer，开启
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);
    // 获取顶点着色器中纹理变量，分配buffer，开启
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
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 顶点数量
 * @returns {boolean} 是否初始化完成
 */
function initTextures(gl, n) {
    // 创建纹理对象
    var texture0 = gl.createTexture();
    var texture1 = gl.createTexture();
    if (!texture0 || !texture0) {
        console.log('Failed to create the texture object');
        return false;
    }
    // 获取u_Sampler在内存中的位置
    var u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0'),
        u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler0 || !u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler0 or u_Sampler1');
        return false;
    }
    // 创建图片对象
    var image0 = new Image(),
        image1 = new Image();
    if (!image0 || !image1) {
        console.log('Failed to create image object');
        return false;
    }
    // 注册图片加载完成事件
    image0.onload = function () {
        loadTexture(gl, n, texture0, u_Sampler0, image0, 0);
    };
    image1.onload = function () {
        loadTexture(gl, n, texture1, u_Sampler1, image1, 1);
    };
    // 设置图片路径
    image0.src = '../resources/sky.jpg';
    image1.src = '../resources/circle.gif';

    return true;
}
var g_texUnit0 = false, g_texUnit1 = false;

/**
 * 为WebGL配置纹理
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 顶点数量
 * @param texture {Object} 纹理对象
 * @param u_Sampler {Object} 取样器
 * @param image {Object} 图片对象
 * @param texUnit {Number} 纹理单元编号
 */
function loadTexture(gl, n, texture, u_Sampler, image, texUnit) {
    // 对纹理对象进行y轴翻转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 激活纹理单元
    if (texUnit == 0) {
        gl.activeTexture(gl.TEXTURE0);
        g_texUnit0 = true;
    } else {
        gl.activeTexture(gl.TEXTURE1);
        g_texUnit1 = true;
    }
    // 绑定纹理对象到目标上
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 设置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // 将纹理单元编号传递给取样器
    gl.uniform1i(u_Sampler, texUnit);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    if (g_texUnit0 && g_texUnit1) {
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }
}