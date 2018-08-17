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
    '}\n';
// 主程序
function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if(!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initializes the shaders');
        return;
    }
    // 设置点的位置的大小
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set positions or pointSize of the vertex');
        return;
    }
    // 设置canvas的清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.POINTS, 0, n);
}
// 设置点的位置
function initVertexBuffers(gl) {
    // 创建点位置的浮点类数组
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);

    // 创建点大小的浮点类数组
    var sizes = new Float32Array([
        10.0, 20.0, 30.0
    ]);
    var n = 3; // 点的数量
    // 创建缓冲区
    var vertexBuffer = gl.createBuffer(); // 点位置缓冲区
    var sizeBuffer = gl.createBuffer(); // 点大小缓冲区
    if (!vertexBuffer || !sizeBuffer) {
        console.log('Failed to create vertex or size buffer object');
    }
    // 将顶点坐标写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage of position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    // 将顶点大小写入缓冲区对象并开启
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
    var a_PointSize = gl.getAttribLocation(gl.program, 'a_PointSize');
    if (a_PointSize < 0) {
        console.log('Failed to get the storage of pointSize');
        return -1;
    }
    gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_PointSize);

    return n;
}