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
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);
    // 定义定点数量
    var n = 3;

    // 1. 创建缓冲区
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

/**划重点
 * 1. 因为Tx, Ty, Tz对于所有顶点来说是固定(一致)的，所以我们用uniform变量u_Translation来表示三角形的平移距离
 * 2. GLSL ES中的赋值操作只能发生在相同的类型的变量之间
 * 3. 因为a_Position和u_Translation变量都是vec4类型的，所以可以直接相加，两个矢量的对应分量同时相加.
 * 4. 为什么gl.uniform4f()的最后一个参数为0？
 *      因为平移后点坐标第4分量w1+w2必须是1.0(因为点的位置坐标平移后还是一个点位置坐标)，
 *      而w1是1.0(它是平移前点坐标第4分量)，所以平移矢量的本身的第4分量w2只能是0.0
 * */