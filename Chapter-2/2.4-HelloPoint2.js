// 顶点着色器程序
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' + // 定义attribute变量
    'attribute float a_PointSize;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = a_PointSize;\n' +
    '}\n';
// 片元着色器程序
var FSHADER_SOURCE =
    'void main () {\n' +
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
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }
    // 获取attribute变量的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_PointSize = gl.getAttribLocation(gl.program, "a_PointSize");
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    if (a_PointSize < 0) {
        console.log('Failed to get the storage location of a_PointSize');
        return;
    }
    // 将顶点位置传输给attribute变量
    gl.vertexAttrib3f(a_Position, 0.0, 0.0, 0.0);
    gl.vertexAttrib1f(a_PointSize, 20.0);
    // 设置<canvas>背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制一个点
    gl.drawArrays(gl.POINTS, 0, 1);
}

/**划重点
 * 1. 将位置信息从javascript程序中传给着色器。有两种方式：attribute变量和uniform变量
 *      a. attribute变量： 是GLSL ES变量,被用来从外部向顶点着色器内传输数据，传输的是那些与顶点相关的数据，只有顶点着色器能使用.
 *      b. uniform变量：传输的是那些对于所有顶点都相同(或与顶点无关)的数据.
 * 2. attribute变量的使用:
 *      a. 在顶点着色器中声明attribute变量；
 *      b. 将attribute变量赋值给gl_Position变量；
 *      c. 向attribute变量传输数据。
 * 3. 关键词attribute被称为存储限定符，它表示接下来的变量是一个attribute变量。attribute变量必须声明成全局变量，数据将从着色器外部传给该变量
 * 3. 变量的声明格式必须按照以下的格式：
 *      <存储限定符><类型><变量名>
 *      attribute  vec4  a_Position
 * 4. 程序对象(gl.program): 它包含了顶点着色器和片元着色器。
 * 5. 齐次坐标：
 *      a. 由4个分量组成的矢量被成为齐次坐标，它能够提高处理三位数据的效率。
 *      b. 齐次坐标(x, y, z, w) 等价于三维坐标(x/w, y/w, z/w)
 *      c. w的值必须大于等于0。如果w趋近于0，那么它表示的点将趋近无穷远。
 * */