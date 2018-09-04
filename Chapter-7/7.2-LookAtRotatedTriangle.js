// 顶点着色器
var VSHADER_SOURCE =
    `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ViewMatrix; // 视图矩阵
    uniform mat4 u_ModelMatrix; // 模型矩阵
    varying vec4 v_Color;
    void main() {
        gl_Position = u_ViewMatrix * u_ModelMatrix * a_Position;
        v_Color = a_Color;
    }
`

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
`
//
function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 初始化渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize the shaders');
        return;
    }
    // 设置点数据
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // 设置canvas的背景清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 获取u_ViewMatrix变量的存储地址
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ViewMatrix || !u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix or u_ModelMatrix');
        return;
    }
    // 设置视点、视线和上方向
    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(0.20,0.25,0.25, 0,0,0, 0,1,0);
    // 计算旋转矩阵
    var modelMatrix = new Matrix4();
    modelMatrix.setRotate(-10, 0, 0, 1); // 绕z轴旋转
    // 将视图矩阵传给u_ViewMatrix变量
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // 清除背景
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

/**
 * 设置顶点缓冲数据
 * @param gl {Object} WebGL渲染上下文
 * @returns {number} 顶点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据浮点类型数组
    var verticesColors = new Float32Array([
        0.0,  0.5, -0.4,    0.4, 1.0, 0.4, // The back green one
        -0.5, -0.5, -0.4,    0.4, 1.0, 0.4,
        0.5, -0.5, -0.4,    1.0, 0.4, 0.4,

        0.5,  0.4, -0.2,    1.0, 0.4, 0.4, // The middle yellow one
        -0.5,  0.4, -0.2,    1.0, 1.0, 0.4,
        0.0, -0.6, -0.2,    1.0, 1.0, 0.4,

        0.0,  0.5,  0.0,    0.4, 0.4, 1.0, // The front blue one
        -0.5, -0.5,  0.0,    0.4, 0.4, 1.0,
        0.5, -0.5,  0.0,    1.0, 0.4, 0.4
    ]);
    var n = 9;
    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将顶点数据存入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    // 获取字节的大小
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // 获取顶点着色器中a_Position的存储地址,并分配缓冲区,开启
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6, 0);
    gl.enableVertexAttribArray(a_Position);
    // 获取顶点着色器中a_Color的存储地址,并分配缓冲区,开启
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

/**划重点
 * 1. 如何定义三位世界的观察者：
 *      在哪个地方，朝哪儿看，视野有好宽，能看好远
 * 2. 视点：
 *      观察者所在的三维空间中位置，视线的起点。
 * 3. 观察目标点：
 *      被观察所在的点。视线从视点出发，穿过观察目标点并继续延伸，观察目标点是一个点，而不是视线方向，
 *      只有同时知道观察目标点和视点，才能算出视线方向。
 * 4. 上方向：
 *      最终绘制在屏幕上的影像中的向上的方向。如果，仅仅确定了视点和观察点，观察者还是可能以视线为轴
 *      旋转的。所以为了将观察者固定，我们还需要指定上方向。
 * 5. 视线：
 *      从视点出发沿着观察方向的视线称作视线。
 * */