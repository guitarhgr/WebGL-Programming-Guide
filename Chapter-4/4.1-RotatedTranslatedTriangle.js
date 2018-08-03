// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'void main() {\n' +
    '   gl_Position = u_ModelMatrix * a_Position;\n' +
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

    }
    // 初始化渲染器
    // 设置点的位置
    // 创建平移矩阵
    // 计算模型矩阵
    // 将模型矩阵传到顶点着色器上
    // 设置清除canvas的背景色
    // 清除canvas
    // 绘制三角形
}

function initVertexBuffers(gl) {
    // 创建顶点的浮点类数组
        // 设置点的数量
    //1. 创建缓冲区对象
    //2. 绑定缓冲区对象
    //3. 将数据写入缓冲区
    //4. 将缓冲区对象分配给一个attribute变量
    //5. 开启attribute变量
}