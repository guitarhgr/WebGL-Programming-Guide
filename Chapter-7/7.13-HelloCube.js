// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    varying vec4 v_Color;
    void main () {
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
        console.log('Failed to get the rendering context fore WebGL');
        return;
    }
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置顶点数据到缓冲区
    var n = initVertexBuffers(gl);
    if (n < -1) {
        console.log('Failed to set the vertex information');
        return;
    }
    // 设置canvas清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启深度测试
    gl.enable(gl.DEPTH_TEST);
    // 获取u_MvpMatrix的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix');
        return;
    }
    // 创建视图矩阵
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(30, 1, 1, 100);
    mvpMatrix.lookAt(3,3,7,  0,0,0,  0,1,0);

    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

/**
 * 设置顶点数据
 * @param gl {object} WebGL渲染上下文
 * @returns {number} 顶点数量
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
    // 创建顶点坐标数据的浮点类型的数组
    var verticesColors = new Float32Array([
         1.0,  1.0,  1.0,    1.0, 1.0, 1.0, // v0 White
        -1.0,  1.0,  1.0,    1.0, 0.0, 1.0, // v1 Magenta
        -1.0, -1.0,  1.0,    1.0, 0.0, 0.0, // v2 Red
         1.0, -1.0,  1.0,    1.0, 1.0, 0.0, // v3 Yellow
         1.0, -1.0, -1.0,    0.0, 1.0, 0.0, // v4 Green
         1.0,  1.0, -1.0,    0.0, 1.0, 1.0, // v5 Cyan
        -1.0,  1.0, -1.0,    0.0, 0.0, 0.0, // v6 Blue
        -1.0, -1.0, -1.0,    0.0, 0.0, 0.0, // v7 Black
    ]);
    // 顶点索引
    var indices = new Uint8Array([
        0, 1, 2,    0, 2, 3, // 前
        0, 3, 4,    0, 4, 5, // 右
        0, 5, 6,    0, 6, 1, // 上
        1, 6, 7,    1, 7, 2, // 左
        7, 4, 3,    7, 3, 2, // 下
        6, 5, 4,    6, 4, 7  // 后
    ]);

    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    var indexBuffer = gl.createBuffer();
    if (!vertexBuffer || !indexBuffer) {
        console.log('Failed to create the vertex or index buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    // 获取字节大小
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // 获取a_Position和a_Color的存储地址
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position'),
        a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Position < 0 || a_Color < 0) {
        console.log('Failed to get the storage location of a_Position or a_Color');
        return -1;
    }
    // 给a_Position分配缓冲
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    // 开启a_Position
    gl.enableVertexAttribArray(a_Position);
    // 给a_Color分配缓冲
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    // 开启a_Color
    gl.enableVertexAttribArray(a_Color);

    // 将顶点索引数据写入缓冲区对象
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}