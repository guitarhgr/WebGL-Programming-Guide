// 顶点着色器
var VSHADER_SOURCE=
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_xformMatrix\n;' +
    'void main() {\n' +
    '   gl_Position = u_xformMatrix * a_Position;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';

function main() {
    // 获取canvas元素
    var canvas = document.getElementById("webgl");
    // 获取webgl渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to initialize shaders");
        return;
    }
    // 设置点的位置
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log("Failed to set the positions of a vertex shader");
        return;
    }
    // 创建缩放矩阵
    var Sx = 1.0, Sy = 1.5; Sz = 1.0;
    var x_formMatrix = new Float32Array([
         Sx, 0.0, 0.0, 0.0,
        0.0,  Sy, 0.0, 0.0,
        0.0, 0.0,  Sz, 0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    var u_xformMatrix = gl.getUniformLocation(gl.program, "u_xformMatrix");
    if (!u_xformMatrix) {
        console.log("Failed to get the storage location of the u_xformMatrix");
        return;
    }
    gl.uniformMatrix4fv(u_xformMatrix, false ,x_formMatrix);
    // 设置canvas背景颜色
    gl.clearColor(0, 0, 0, 1);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
    // 创建顶点的类数组
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);

    var n = 3; // 设置点的数量

    // 1.创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log("Failed to create the buffer object");
        return -1;
    }
    // 2.绑定缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 3.将数据写入缓冲区对象
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 4.将缓冲区对象分配给一个attribute变量
    var a_Postion = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Postion < 0) {
        console.log("Failed to get the storage location of the a_Position");
        return -1;
    }
    gl.vertexAttribPointer(a_Postion, 2, gl.FLOAT, false, 0, 0);
    // 5.开启attribute变量
    gl.enableVertexAttribArray(a_Postion);

    return n;
}