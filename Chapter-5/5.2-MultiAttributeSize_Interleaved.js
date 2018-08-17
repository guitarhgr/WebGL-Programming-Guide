// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute float a_PointSize;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = a_PointSize;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n'
// 主程序入口
function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context of WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize the shaders');
        return;
    }
    // 设置点的位置
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex positions');
        return;
    }

    // 设置canvas的清除背景色
    gl.clearColor(0, 0, 0, 1);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.POINTS, 0, n);
}
// 设置点的位置
function initVertexBuffers(gl) {
    // 创建顶点数据的浮点类数组
    var vertexSizes = new Float32Array([
         0.0,  0.5, 10.0,
        -0.5, -0.5, 20.0,
         0.5, -0.5, 30.0
    ]);
    var n = 3; // 顶点数量
    // 创建缓冲区
    var vertexSizeBuffer = gl.createBuffer();
    if (!vertexSizeBuffer) {
        console.log('Failed to create the vertex buffer');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexSizeBuffer);
    // 将数据写入缓冲区对象
    gl.bufferData(gl.ARRAY_BUFFER, vertexSizes, gl.STATIC_DRAW);
    // 将顶点位置分配给一个attribute(a_Position)变量
    var FSIZE = vertexSizes.BYTES_PER_ELEMENT; // 每个元素的大小(字节数)


    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage position of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 3, 0); // 将缓冲区对象分配给对应变量
    // 开启并分配
    gl.enableVertexAttribArray(a_Position);

    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_PointSize < 0) {
        console.log('Failed to get the storage positions of a_PointSize');
        return -1;
    }
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 3, FSIZE * 2);
    gl.enableVertexAttribArray(a_PointSize);

    return n;
}