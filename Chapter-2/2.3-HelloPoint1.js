// 顶点着色器程序
var VSHADER_SOURCE =
    'void main() {\n' +
    '   gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // 设置顶点坐标
    '   gl_PointSize = 10.0;\n' + // 设置点的大小
    '}\n';
// 片元着色器程序
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' + // 设置点的颜色
    '}\n';

function main() {
    // 获取<canvas>元素
    var canvas = document.getElementById("webgl");
    // 获取WebGL绘图上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }
    // 设置<canvas>的背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清空<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制一个点
    gl.drawArrays(gl.POINTS, 0, 1);
}
/**划重点
 * 1. 顶点着色器(Vertex shader)：
 *    顶点着色器是用来描述顶点特性(如位置、颜色等)的程序。
 * 2. 顶点(vertex)：
 *    顶点是指二维或三维空间中的一个点，比如二维或三维图形的端点或交点。
 * 3. 片元着色器(Fragment shader):
 *    进行逐片元处理过程如光照的程序。
 * 4. 片元(fragment):
 *    WebGL术语，可以将其理解为像素
 * */