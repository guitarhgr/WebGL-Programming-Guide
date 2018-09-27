// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Color; // 颜色
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix; // 视图矩阵
    uniform vec3 u_LightColor; // 光线颜色
    uniform vec3 u_LightDirection; // 光线方向(归一化的世界坐标)
    varying vec4 v_Color;
    void main () {
        gl_Position = u_MvpMatrix * a_Position;
        vec3 normal = normalize(vec3(a_Normal)); // 对法向量进行归一化
        float nDotL = max(dot(u_LightDirection, normal), 0.0); // 计算光线方向和法向量的点积
        vec3 diffuse = u_LightColor * vec3(a_Color) * nDotL; // 计算漫反射光的颜色
        v_Color = vec4(diffuse, a_Color.a);
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
        return;
    }
    // 设置顶点的坐标、颜色、法向量
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex buffer object');
        return;
    }
    // 设置canvas清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST); // 开启深度测试(隐藏面消除)
    // 获取u_MvpMatrix、u_LightColor、u_LightDirection的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix'),
        u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor'),
        u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
    if (!u_MvpMatrix || !u_LightColor || !u_LightDirection) {
        console.log('Failed to get the storage location of u_MvpMatrix、u_LightColor or u_LightDirection');
        return;
    }
    // 设置光线颜色(白色)
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // 设置光线方向(世界坐标系下的)
    var lightDirection = new Vector3([0.5, 3.0, 4.0]);
    lightDirection.normalize(); // 归一化
    gl.uniform3fv(u_LightDirection, lightDirection.elements);

    // 计算模型视图投影矩阵
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100); // 设置透视投影
    mvpMatrix.lookAt(3,3,7,  0,0,0,  0,1,0); // 设置朝向
    // 将模型视图投影矩阵传递给u_MvpMatrix变量
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 绘制图形
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

/**
 * 设置顶点数据到缓冲区
 * @param gl {Object} WebGL渲染上下文
 * @returns {number} 渲染顶点的次数
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
    var vertices = new Float32Array([   // Coordinates
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v2-v3 front
         1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v2 down
         1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
    ]);
    var colors = new Float32Array([    // Colors
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
    ]);
    var normals = new Float32Array([    // Normal
        0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
        1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
        0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
        0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
        0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);
    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // 将位置、颜色、法向量写入缓冲区
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

/**
 * 设置ArrayBuffer
 * @param gl {Object} WebGL渲染上下文
 * @param attribute {String} attribute字段
 * @param data {Float32Array} 数据
 * @param num {Number} 缓冲区每个分量的个数
 * @param type {Number} 数据类型
 * @returns {boolean} 是否设置成功
 */
function initArrayBuffer(gl, attribute, data, num, type) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create array buffer object');
        return false;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据存入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 将缓冲区分配给attribute变量
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log(`Failed to get the storage location of ${attribute}`);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
    return true;
}