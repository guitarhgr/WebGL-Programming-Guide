// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
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
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置顶点位置
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of vertices');
        return;
    }
    // 设置<canvas>背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制矩形
    // gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
}

function initVertexBuffers(gl) {
    // 创建顶点类型化数组
    var vertices = new Float32Array([
        -0.5,0.5,  -0.5,-0.5,  0.5,0.5,  0.5,-0.5
    ]);
    // 定义顶点数量
    var n = 4;
    // 1. 创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // 2. 绑定缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 3. 将数据写入缓冲区对象
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 4. 将缓冲区对象分配给一个attribute变量
    // 获取a_Position变量的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // 5. 开启attribute变量
    gl.enableVertexAttribArray(a_Position);

    return n;
}