// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    void main() {
        gl_Position = a_Position;
        gl_PointSize = 10.0;
    }
`;
// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    void main() {
        float dist = distance(gl_PointCoord, vec2(0.5,0.5));
        if (dist < 0.5) {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        } else {
            discard;
        }
        
    }
`;

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
        console.log('Failed to set positions fo the vertices');
        return;
    }
    // 初始化顶点缓冲区
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }
    // 设置背景色
    gl.clearColor(0, 0, 0, 1);
    // 清空<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制
    gl.drawArrays(gl.POINTS, 0, n);
}

/**
 * 初始化顶点缓冲区
 * @param gl
 * @returns {*}
 */
function initVertexBuffers(gl) {
    var vertices = new Float32Array([
        0.0, 0.5, -0.5, -0.5, 0.5, -0.5
    ]);
    var n = 3; // 顶点数量
    // 创建缓冲区对象
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // 将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 向缓冲区对象中写入数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    // 将缓冲区对象分配给a_Position变量
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    // 连接a_Position变量与分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Position);
    return n;
}