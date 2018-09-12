// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
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
    void main () {
        gl_FragColor = v_Color;
    }
`;

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
    // 设置顶点坐标和颜色
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex buffer information');
        return;
    }
    // 设置<canvas>的清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 获取u_ViewMatrix和u_ProjMatrix的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix or u_ProjMatrix, u_ModelMatrix');
        return -1;
    }
    // 创建视图矩阵和透视投影矩阵
    var mvpMatrix = new Matrix4(), // 模型视图投影矩阵
        viewMatrix = new Matrix4(), // 视图矩阵
        projMatrix = new Matrix4(), // 投影矩阵
        modelMatrix = new Matrix4(); // 模型矩阵

    modelMatrix.setTranslate(0.75, 0, 0);
    viewMatrix.setLookAt(0,0,5,  0,0,-100,  0,1,0);
    projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);// 计算模型视图投影矩阵

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, n);

    modelMatrix.setTranslate(-0.75, 0, 0);
    // 计算模型视图投影矩阵
    mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

/**
 * 设置顶点数据到缓冲区
 * @param gl {object} WebGL渲染上下文
 * @returns {number} 顶点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据的浮点类型数组
    var verticesColors = new Float32Array([
        // Vertex coordinates and color
        0.0,  1.0,  -4.0,  0.4,  1.0,  0.4, // The back green one
        -0.5, -1.0,  -4.0,  0.4,  1.0,  0.4,
        0.5, -1.0,  -4.0,  1.0,  0.4,  0.4,

        0.0,  1.0,  -2.0,  1.0,  1.0,  0.4, // The middle yellow one
        -0.5, -1.0,  -2.0,  1.0,  1.0,  0.4,
        0.5, -1.0,  -2.0,  1.0,  0.4,  0.4,

        0.0,  1.0,   0.0,  0.4,  0.4,  1.0,  // The front blue one
        -0.5, -1.0,   0.0,  0.4,  0.4,  1.0,
        0.5, -1.0,   0.0,  1.0,  0.4,  0.4,
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
    // 将顶点数据存入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    // 获取字节的大小
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // 获取顶点位置变量，分配缓冲区，开启
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6, 0);
    gl.enableVertexAttribArray(a_Position);
    // 获取顶点颜色变量，分配缓冲区，开启
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Color < 0) {
        console.log('Failed to get the storage location of a_Color');
        return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}