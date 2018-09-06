// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ViewMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_ViewMatrix * a_Position;
        v_Color = a_Color;
    }
`;
// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    varying vec4 v_Color;
    void main() {
        gl_FragColor = v_Color;
    }
`;

function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 获取渲染上下文
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
    // 设置顶点数据
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // 获取u_ViewMatrix变量的存储地址
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 创建视图矩阵的Matrix4对象
    var viewMatrix = new Matrix4();
    // 注册键盘事件响应函数
    document.onkeydown = function (event) {
        changeEyePosition(event, gl, n, u_ViewMatrix, viewMatrix);
    };
    drawMatrix(gl, n, u_ViewMatrix, viewMatrix);
}

/**
 * 设置顶点数据缓冲区
 * @param gl {Object} WebGL渲染上下文
 * @returns {number} 返回的顶点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据的浮点类型数组
    var verticesColors = new Float32Array([
         0.0,  0.5, -0.4,    0.4, 1.0, 0.4,
        -0.5, -0.5, -0.4,    0.4, 1.0, 0.4,
         0.5, -0.5, -0.4,    1.0, 0.4, 0.4,

         0.5,  0.4, -0.2,    1.0, 0.4, 0.4,
        -0.5,  0.4, -0.2,    1.0, 1.0, 0.4,
         0.0, -0.6, -0.2,    1.0, 1.0, 0.4,

         0.0,  0.5,  0.0,    0.4, 0.4, 1.0,
        -0.5, -0.5,  0.0,    0.4, 0.4, 1.0,
         0.5, -0.5,  0.0,    1.0, 0.4, 0.4
    ]);
    var n = 9; // 顶点数量

    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create vertex buffer object');
        return -1;
    }

    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将数据传入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    // 获取字节的大小
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // 获取顶点位置和颜色的存储位置，分配缓冲区，开启
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Position < 0 || a_Color < 0) {
        console.log('Failed to get the storage location of a_Position or a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

var g_eyeX = 0.20, g_eyeY = 0.25, g_eyeZ = 0.25; // 视点
/**
 * 改变视角
 * @param event {Object} 事件
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 顶点数量
 * @param u_ViewMatrix {Object} 视图矩阵在顶点的存储位置
 * @param viewMatrix {Object} 视图矩阵
 */
function changeEyePosition(event, gl, n, u_ViewMatrix, viewMatrix) {
    if (event.keyCode == 39) { // 按下右键
        g_eyeX += 0.01;
    }
    else if (event.keyCode == 37) { // 按下左键
        g_eyeX -= 0.01;
    }
    else if (event.keyCode == 38) { // 按下上键
        g_eyeY += 0.01;
    }
    else if (event.keyCode == 40 ) { // 按下下键
        g_eyeY -= 0.01;
    }
    else { // 按下其他键
        return;
    }

    drawMatrix(gl, n, u_ViewMatrix, viewMatrix);
}

/**
 * 绘制矩阵
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 顶点数量
 * @param u_viewMatrix {Object} 视图矩阵在顶点的存储位置
 * @param viewMatrix {Object} 视图矩阵
 */
function drawMatrix(gl, n, u_viewMatrix, viewMatrix) {
    // 设置视点和视线
    viewMatrix.setLookAt(g_eyeX,g_eyeY,g_eyeZ,  0,0,0,  0,1,0);

    // 将视图矩阵传递给u_viewMatrix变量
    gl.uniformMatrix4fv(u_viewMatrix, false, viewMatrix.elements);

    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}