// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform vec4 u_Translation;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position + u_Translation;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';

// 平移的距离
var Tx = 0.5, Ty = 0.5, Tz = 0.0;

function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取webgl渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置点的位置
    var n = initVertexBuffer(gl);
    if (n < 0) {
        console.log('Failed to set position of the vertices');
        return;
    }
    // 将平移距离传输给顶点着色器
    var u_Translation = gl.getUniformLocation(gl.program, 'u_Translation');
    if (!u_Translation) {
        console.log('Failed to get storage location of u_Translation');
        return;
    }
    gl.uniform4f(u_Translation, Tx, Ty, Tz, 0.0);
    // 设置背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffer(gl) {
    // 创建类型化数组
    // 定义定点数量
    // 1. 创建缓冲区
    // 2. 绑定缓冲区对象
    // 3. 将数据写入缓冲区对象
    // 4. 将缓冲区对象分配给一个attribute变量
    // 获取a_Position变量的存储位置
    // 5. 开启attribute变量
}