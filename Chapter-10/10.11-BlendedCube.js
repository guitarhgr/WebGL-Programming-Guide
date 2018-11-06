// 顶点着色器
var VSHADER_SOURCE =
    `
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    varying vec4 v_Color;
    void main () {
        gl_Position = u_MvpMatrix * a_Position;
        v_Color = a_Color;
    }
`;
// 片元着色器
var FSHADER_SOURCE =
    `
    #ifdef GL_ES
        precision mediump float;
    #endif
    varying vec4 v_Color;
    void main () {
        gl_FragColor = v_Color;
    }
`;

function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return
    }
    // 设置顶点数据到缓冲区
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // 设置<canvas>清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 设置隐藏面消除(开启深度测试)
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // 获取u_MvpMatrix的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get storage location of u_MvpMatrix');
        return;
    }
    // 创建视图矩阵
    var mvpMatrix = new Matrix4();
    // 设置透视投影
    mvpMatrix.setPerspective(30, 1, 1, 100);
    // 设置朝向
    mvpMatrix.lookAt(3,3,7,  0,0,0,  0,1,0);
    // 将透视投影矩阵传递给变量u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 清除背景色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制图形
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

/**
 * 设置顶点缓冲区
 * @param gl {object} WebGL渲染上下文
 * @returns {number} 片元着色器渲染次数
 */
function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    // 顶点坐标
    var vertices = new Float32Array([
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,  // v0-v1-v2-v3 front
         1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,  // v0-v3-v4-v5 right
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,  // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,  // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,  // v7-v4-v3-v2 down
         1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0   // v4-v7-v6-v5 back
    ]);
    // 颜色
    var colors = new Float32Array([
        0.5, 0.5, 1.0, 0.4,   0.5, 0.5, 1.0, 0.4,   0.5, 0.5, 1.0, 0.4,   0.5, 0.5, 1.0, 0.4,  // v0-v1-v2-v3 front(blue)
        0.5, 1.0, 0.5, 0.4,   0.5, 1.0, 0.5, 0.4,   0.5, 1.0, 0.5, 0.4,   0.5, 1.0, 0.5, 0.4,  // v0-v3-v4-v5 right(green)
        1.0, 0.5, 0.5, 0.4,   1.0, 0.5, 0.5, 0.4,   1.0, 0.5, 0.5, 0.4,   1.0, 0.5, 0.5, 0.4,  // v0-v5-v6-v1 up(red)
        1.0, 1.0, 0.5, 0.4,   1.0, 1.0, 0.5, 0.4,   1.0, 1.0, 0.5, 0.4,   1.0, 1.0, 0.5, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0, 0.4,   1.0, 1.0, 1.0, 0.4,   1.0, 1.0, 1.0, 0.4,   1.0, 1.0, 1.0, 0.4,  // v7-v4-v3-v2 down
        0.5, 1.0, 1.0, 0.4,   0.5, 1.0, 1.0, 0.4,   0.5, 1.0, 1.0, 0.4,   0.5, 1.0, 1.0, 0.4   // v4-v7-v6-v5 back
    ]);
    // 索引
    var indices = new Uint8Array([
        0,  1, 2,   0, 2, 3,    // front
        4,  5, 6,   4, 6, 7,    // right
        8,  9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);
    // 创建索引缓冲区
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create index buffer object');
        return -1
    }
    // 设置顶点数据缓冲
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) {
        console.log('Failed to set vertices buffer object');
        return -1;
    }
    // 设置颜色缓冲
    if (!initArrayBuffer(gl, colors, 4, gl.FLOAT, 'a_Color')) {
        console.log('Failed to set colors buffer object');
        return -1;
    }
    // 将indices写入缓冲区
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

/**
 * 设置缓冲区
 * @param gl {object} WebGl渲染上下文
 * @param data {array} 存入缓冲区的值
 * @param num {number} 大小
 * @param type {}
 * @param attribute {string}
 * @returns {boolean} 是否设置成功
 */
function initArrayBuffer(gl, data, num, type, attribute) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer object');
        return false;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据存入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 获取变量存储地址
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log(`Failed to get storage location of ${attribute}`);
        return false;
    }
    // 将attribute变量关联缓冲区
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // 将缓冲区对象分配给attribute变量
    gl.enableVertexAttribArray(a_attribute);

    return true;
}