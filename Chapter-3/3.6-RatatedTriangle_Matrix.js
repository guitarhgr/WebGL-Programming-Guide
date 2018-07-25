// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_xformMaxtrix;\n' +
    'void main() {\n' +
    '   gl_Position = u_xformMaxtrix * a_Position;\n' + // 矩阵运算得到新的坐标
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';

var ANGLE = 90.0; // 旋转角度

function main() {
    // 获得<canvas>元素
    var canvas = document.getElementById("webgl");
    // 获取webgl渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log("Failed to get the rendering context for WebGL");
        return;
    }
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log("Failed to initialize shaders.");
        return;
    }
    // 设置顶点的位置
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log("Failed to set the position of a vertex shader");
        return;
    }
    // 创建旋转矩阵
    var radian = (Math.PI / 180.0) * ANGLE; // 角度转为弧度
    var cosB = Math.cos(radian), sinB = Math.sin(radian);
    // 注意webgl中矩阵是列主序的
    // 这是按行主序的矩阵
    // [
    //     cosB, -sinB, 0.0, 0.0,
    //     sinB,  cosB, 0.0, 0.0,
    //      0.0,   0.0, 1.0, 0.0,
    //      0.0,   0.0, 0.0, 1.0
    // ]
    // 这是按列主序的矩阵
    var xformMatrix = new Float32Array([
         cosB, sinB, 0.0, 0.0,
        -sinB, cosB, 0.0, 0.0,
          0.0,  0.0, 1.0, 0.0,
          0.0,  0.0, 0.0, 1.0
    ]);
    // 将旋转矩阵传输给顶点着色器
    var u_xformMatrix = gl.getUniformLocation(gl.program, "u_xformMaxtrix");
    if(!u_xformMatrix) {
        console.log("Failed to get the storage location of u_xformMaxtrix");
        return;
    }
    gl.uniformMatrix4fv(u_xformMatrix, false, xformMatrix);
    // 设置<canvas>背景色
    gl.clearColor(0, 0, 0, 1);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
    // 创建坐标点的类数组
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);
    var n = 3; // 定义顶点的数量
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
    var a_Position = gl.getAttribLocation(gl.program, "a_Position");    // 获取a_Position变量的存储位置
    if (a_Position < 0) {
        console.log("Failed to get the storage location of a_Position");
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // 5. 开启attribute变量
    gl.enableVertexAttribArray(a_Position);

    return n;
}
/**划重点:
 * 1. 存储矩阵的方式：按行主序和按列主序
 * 2. WebGL和OpenGL一样，矩阵元素是按列主序存储在数组中。
 * */