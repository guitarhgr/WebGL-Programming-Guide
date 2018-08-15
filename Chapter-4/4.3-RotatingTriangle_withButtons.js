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
// 主程序
function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取webgl渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering content for WebGL');
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
    // 设置清除canvas的背景色
    gl.clearColor(0.0, 0.0, 0.0, 1);
    // 获取u_ModelMatrix变量的位置
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage position of the u_ModelMatrix');
        return;
    }
    var curAngle = 0.0; // 当前角度
    // 创建矩阵
    var modelMatrix = new Matrix4();
    // 创建循环函数
    var tick = function () {
        curAngle = animate(curAngle); // 算出当前角度
        draw(gl, n, curAngle, modelMatrix, u_ModelMatrix); // 绘制三角形
        requestAnimationFrame(tick);
    }
    tick();
}
// 设置点位置
function initVertexBuffers(gl) {
    // 创建点的位置的浮点类数组
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5, -0.5
    ]);
    var n = 3; // 点的数量
    // 1.创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }
    // 2.绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 3.将数据写入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 4.将缓冲区分配给一个attribute
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage position of the a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // 5.开启变量
    gl.enableVertexAttribArray(a_Position);
    return n;
}
// 更新三角形角度
var g_last = (new Date()).getTime();
var ANGLE_STEP = 45.0;
function animate(angle) {
    var now = (new Date()).getTime();
    var elapsed = now - g_last;
    g_last = now;
    var newAngle = angle + (elapsed * ANGLE_STEP) / 1000.0;
    return newAngle %= 360;
}
// 绘制三角形
function draw(gl, n, curAngle, modelMatrix, u_modelMatrix) {
    modelMatrix.setRotate(curAngle, 0, 0, 1);
    modelMatrix.translate(0.35, 0, 0);

    gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function up() {
    ANGLE_STEP += 10.0;
}

function down() {
    ANGLE_STEP -= 10.0;
}