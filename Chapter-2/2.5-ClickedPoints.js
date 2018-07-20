// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute float a_PointSize;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = a_PointSize;\n' +
    '}\n';
// 片元着色器程序
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
        console.log('Failed to get rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE,FSHADER_SOURCE)) {
        console.log('Failed to  get initialize shaders.');
        return;
    }
    // 获取a_Position/a_PointSize变量的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_Position < 0 || !a_PointSize < 0) {
        console.log('Failed to get the storage location of a_Position or a_PointSize');
        return;
    }
    // 注册鼠标点击事件响应函数
    canvas.onmousedown = function (event) {
        click(event, gl, canvas, a_Position, a_PointSize);
    }
    // 设置<canvas>背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}
// 鼠标点击位置数组
var g_points = [];
// 鼠标点击响应函数
function click(event, gl, canvas, a_Position, a_PointSize) {
    var x = event.clientX; // 鼠标点击处的x坐标
    var y = event.clientY; // 鼠标点击处的y坐标
    var rect = event.target.getBoundingClientRect(); // 返回元素的大小及其相对于视口的位置
    x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
    // 将坐标存储在g_points数组中
    g_points.push([x, y]);
    // g_points.push(y);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 循环遍历 将点的位置传递到变量中a_Position
    var len = g_points.length;
    for (var i = 0; i < len; i ++) {
        var xy = g_points[i];
        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
        gl.vertexAttrib1f(a_PointSize, 10.0);
        // 绘制点
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}
/**反思
 * 1. 颜色缓冲区：
 *      WebGL系统中的绘制操作实际上是在颜色缓冲区中进行绘制的，绘制结束后系统将缓冲区中的内容显示在屏幕上，
 *      然后颜色缓冲区就会被重置，其中的内容就会丢失(默认操作)。所以我们有必要将每次鼠标点击的位置都记录下来。
 *      鼠标每次点击之后，程序都重新绘制。
 * */