// 顶点着色器
var VSHADER_SOURCE =
    `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjMatrix;
    varying vec4 v_Color;
    void main () {
        gl_Position = u_ProjMatrix * u_ViewMatrix * a_Position;
        v_Color = a_Color;
    }
`;
// 片元着色器
var FSHADER_SOURCE =
    `   #ifdef GL_ES
        precision mediump float;
    #endif
    varying vec4 v_Color;
    void main () {
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
        console.log('Failed to initialize the shaders');
        return;
    }
    // 设置顶点数据到缓冲区
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex buffer');
        return;
    }

    // 开启混合
    gl.enable(gl.BLEND);
    // 设置混合函数
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 获取u_ViewMatrix和u_ProjMatrix的存储地址
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix'),
        u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ViewMatrix || !u_ProjMatrix) {
        console.log('Failed to get storage location of u_ViewMatrix or u_ProjMatrix');
        return;
    }

    // 创建视图矩阵
    var viewMatrix = new Matrix4(),
        projMatrix = new Matrix4();
    // 注册键盘事件
    document.onkeydown = function (event) {
        changeEyePosition(event, gl, n, u_ViewMatrix, viewMatrix);
    };

    projMatrix.setOrtho(-1.0, 1.0, -1.0, 1.0, 0.0, 10.0);
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    drawView(gl, n, u_ViewMatrix, viewMatrix);
}

/**
 * 设置顶点数据到缓冲区
 * @param gl
 * @returns {number}
 */
function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
        0.0,  0.6, -0.4,    0.4, 1.0, 0.4, 0.4,
        -0.5, -0.4, -0.4,    0.4, 1.0, 0.4, 0.4,
        0.5, -0.4, -0.4,    1.0, 0.4, 0.4, 0.4,

        0.5,  0.4, -0.2,    1.0, 0.4, 0.4, 0.4,
        -0.5,  0.4, -0.2,    1.0, 1.0, 0.4, 0.4,
        0.0, -0.6, -0.2,    1.0, 1.0, 0.4, 0.4,

        0.0,  0.5,  0.0,    0.4, 0.4, 1.0, 0.4,
        -0.5, -0.5,  0.0,    0.4, 0.4, 1.0, 0.4,
        0.5, -0.5,  0.0,    1.0, 0.4, 0.4, 0.4
    ]);
    var n = 9; // 顶点数量
    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将顶点数据传入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    // 获取字节大小
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // 获取顶点着色器中位置和颜色的存储地址
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position'),
        a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Position < 0 || a_Color < 0) {
        console.log('Failed to get the storage location of a_Position or a_Color');
        return -1;
    }
    // 将缓冲区分配给attribute变量
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 7, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_Color, 4, gl.FLOAT, false, FSIZE * 7, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

var g_EyeX = 0.20, g_EyeY = 0.25, g_EyeZ = 0.25; // 视点
/**
 * 修改视点位置
 * @param event {object} 事件对象
 * @param gl {object} WebGL渲染上下文
 * @param n {number} 顶点数量
 * @param u_ViewMatrix {object} 视图矩阵在顶点着色器的存储地址
 * @param viewMatrix {object} 视图矩阵
 */
function changeEyePosition(event, gl, n, u_ViewMatrix, viewMatrix) {
    switch (event.keyCode) {
        case 39: g_EyeX += 0.01; break; // 右
        case 37: g_EyeX -= 0.01; break; // 左
        case 38: g_EyeY += 0.01; break; // 上
        case 40: g_EyeY -= 0.01; break; // 下
        default: return;
    }
    drawView(gl, n, u_ViewMatrix, viewMatrix);
}

/**
 * 绘制矩阵
 * @param gl {object} WebGL渲染上下文
 * @param n {number} 顶点数量
 * @param u_ViewMatrix {object} 视图矩阵在顶点着色器的存储地址
 * @param viewMatrix {object} 视图矩阵
 */
function drawView(gl, n, u_ViewMatrix, viewMatrix) {
    // 设置视点
    viewMatrix.setLookAt(g_EyeX,g_EyeY,g_EyeZ,  0,0,0,  0,1,0);
    // 将视图矩阵传递个u_ViewMatrix变量
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}