// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_xformMatrix;\n' +
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
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to initialize shaders.");
        return;
    }
    // 设置点位置
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log("Failed to set the positions of a vertex shader");
        return;
    }
    // 创建平移矩阵
    var Tx = 0.5, Ty = 0.5, Tz = 0.0;
    var xformMatrix = new Float32Array([
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
         Tx,  Ty,  Tz, 1.0
    ]);
    // 将平移矩阵传输给顶点着色器
    var u_xformMatrix = gl.getUniformLocation(gl.program, "u_xformMatrix");
    if (!u_xformMatrix) {
        console.log("Failed to get the storage location of the u_xformMatrix");
        return;
    }
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);
    // 设置<canvas>背景色
    gl.clearColor(0, 0, 0, 1);
    // 清除<canvas>背景色
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}
function initVertexBuffers(gl) {
    // 创建点的类数组
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);
    var n = 3; // 设置点的数量

    // 1. 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log("Failed to create the buffer object");
        return -1;
    }
    // 2. 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 3. 将数据写入缓冲区对象
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 4. 将缓冲区对象分配给一个attribute变量
    var a_Position = gl.getAttribLocation(gl.program, "a_Position");
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // 5. 开始attribute变量
    gl.enableVertexAttribArray(a_Position);

    return n;
}