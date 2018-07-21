// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = 10.0;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';

function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取webgl渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to set positions fo the vertices');
        return;
    }
    // 初始化顶点缓冲区
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    // 设置背景色
    gl.clearColor(0, 0, 0, 1);
    // 清空<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制
    gl.drawArrays(gl.POINTS, 0, n);
}

/**
 * 初始化顶点缓冲区
 * @param gl
 * @returns {*}
 */
function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        0.0, 0.5, -0.5, -0.5, 0.5, -0.5
    ]);
    var n = 3; // 顶点数量
    // 创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 向缓冲区对象中写入数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 将缓冲区对象分配给a_Position变量
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // 连接a_Position变量与分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Position);
    return n;
}
/**划重点
 * 1.缓冲区对象：可以一次性的向着色器传入多个顶点的数据。缓冲区对象是WebGL系统中的一块内存区域，
 * 可以一次性的向缓冲区对象中填充大量的顶点数据，然后将这些数据保存在其中，供顶点着色器使用。
 * 2.使用缓冲区对象：
 *      a. 创建缓冲区对象(gl.createBuffer());
 *      b. 绑定缓冲区对象(gl.bindBuffer());
 *      c. 将数据写入缓冲区对象(gl.bufferData());
 *      d. 将缓冲区对象分配给一个attribute变量(gl.vertexAttribPointer());
 *      e. 开启attribute变量(gl.enableVertexAttribArray());
 * 3.类型化数组：绘制三维图形，WebGL通常需要同时处理大量相同类型的数据，例如顶点的坐标和颜色数据。
 * 为了优化性能，WebGL为每种基本数据类型引入了一种特殊的数组(类型化数组)
 * 4.为什么不用Javascript中的数组呢？
 *      Javascript数组Array是一种通用的类型，既可以在里面存储数字也可以存储字符串，而并没有对
 *      "大量元素都是同一种类型"这种情况(比如vertices)进行优化。
 * 5.开启attribute变量后，就不能再用gl。vertexAttrib[1234]f()向attribute传数据了，除非显式的关闭attribute变量。
 * */