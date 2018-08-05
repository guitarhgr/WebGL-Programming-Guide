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
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize the shaders.');
        return;
    }
    // 设置点的位置
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of a vertex shader ');
        return;
    }
    // 创建平移矩阵
    var modelMatrix = new Matrix4();
    // 计算模型矩阵
    var ANGLE = 60.0;
    var Tx = 0.5;
    modelMatrix.setRotate(ANGLE, 0, 0, 1);
    modelMatrix.translate(Tx, 0, 0);
    // 将模型矩阵传到顶点着色器上
    var u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage of the u_ModelMatrix');
        return;
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    // 设置清除canvas的背景色
    gl.clearColor(0, 0, 0, 1);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
    // 创建顶点的浮点类数组
    var vertices = new Float32Array([
        0.0, 0.3,  -0.3,-0.3,  0.3,-0.3
    ]);
    var n = 3;// 设置点的数量
    //1. 创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    //2. 绑定缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    //3. 将数据写入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    //4. 将缓冲区对象分配给一个attribute变量
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage position of the a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    //5. 开启attribute变量
    gl.enableVertexAttribArray(a_Position);

    return n;
}