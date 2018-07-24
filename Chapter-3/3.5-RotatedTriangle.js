// 顶点着色器
// x' = x cosβ - y sinβ
// y' = x sinβ + y conβ
// z' = z
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform float u_CosB, u_SinB;\n' +
    'void main() {\n' +
    '   gl_Position.x = a_Position.x * u_CosB - a_Position.y * u_SinB;\n' +
    '   gl_Position.y = a_Position.x * u_SinB + a_Position.y * u_CosB;\n' +
    '   gl_Position.z = a_Position.z;\n' +
    '   gl_Position.w = 1.0;\n' +
    '}\n';

// 片元着色器
var FSHADER_SOURCE =
    'void main() {\n' +
    '   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
    '}\n';
// 旋转角度
var ANGLE = 90.0;
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
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    // 将旋转图形所需的数据传输给顶点着色器
    var radian = (Math.PI / 180.0) * ANGLE;  // 将角度转为弧度制
    var cosB = Math.cos(radian);
    var sinB = Math.sin(radian);

    var u_CosB = gl.getUniformLocation(gl.program, 'u_CosB');
    var u_SinB = gl.getUniformLocation(gl.program, 'u_SinB');
    if (!u_CosB || !u_SinB) {
        console.log('Failed to get the storage location of u_CosB or u_SinB');
        return;
    }

    gl.uniform1f(u_CosB, cosB);
    gl.uniform1f(u_SinB, sinB);
    // 设置<canvas>背景色
    gl.clearColor(0, 0, 0, 1);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 绘制图形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
    // 创建点的类型化数组
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);
    // 定义点的数量
    var n = 3;

    // 1.创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // 2. 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

    // 3. 将数据写入缓冲区对象
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // 4. 将缓冲区对象分配给一个attribute变量
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');// 获取a_Position变量的存储位置
    if (a_Position < 0) {
        console.log('Failed to get the storage of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    // 5. 开启attribute变量
    gl.enableVertexAttribArray(a_Position);

    return n;
}