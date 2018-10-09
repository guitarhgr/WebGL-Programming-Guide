// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Color; // 颜色
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix; // 视图矩阵
    uniform mat4 u_ModelMatrix; // 模型矩阵
    uniform mat4 u_NormalMatrix; // 用来变换法向量的矩阵
    uniform vec3 u_LightColor; // 光颜色
    uniform vec3 u_LightPosition; // 光源位置(世界坐标系)
    uniform vec3 u_LightAmbientLight; // 环境光
    uniform vec3 u_AmbientLight; // 环境光颜色
    varying vec4 v_Color;
    void main () {
        // 计算位置
        gl_Position = u_MvpMatrix * a_Position;
        // 计算变换后的法向量并归一化
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
        // 计算顶点的世界坐标系
        vec4 vertexPosition = u_ModelMatrix * a_Position;
        // 计算光线方向并归一化
        vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
        // 计算光线方向和法向量的点积
        float nDotL = max(dot(lightDirection, normal), 0.0);
        // 计算漫反射光的颜色
        vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
        // 计算环境光产生的反射光颜色
        vec3 ambient = u_AmbientLight * a_Color.rgb;
        // 将以上两者的相加作为最终的颜色
        v_Color = vec4(diffuse + ambient, a_Color.a);
    }
`;

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

// 主程序 页面加载完成后执行
function main() {
    // 获取<canvas>元素
    var canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the render context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // 设置顶点数据
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // 设置颜色和深度测试(隐藏面消除)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 获取uniform变量的存储地址
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
    var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
    if (!u_MvpMatrix || !u_ModelMatrix || !u_NormalMatrix ||
        !u_LightColor || !u_LightPosition || !u_AmbientLight) {
        console.log('Failed to get the storage location');
        return;
    }

    // 设置光照颜色
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    // 设置光照方向
    gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
    // 设置环境光颜色
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);


    var modelMatrix = new Matrix4(); // 创建模型矩阵
    var mvpMatrix = new Matrix4(); // 创建模型视图矩阵
    var normalMatrix= new Matrix4(); // 创建法向量矩阵

    // 计算模型矩阵
    modelMatrix.setRotate(90, 0, 1, 0); // 设置矩阵旋转
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);// 将模型矩阵传递给uniform变量

    // 设置模型视图矩阵
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100); // 设置透视投影
    mvpMatrix.lookAt(6,6,14,  0,0,0,  0,1,0); // 设置朝向
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // 设置法向量矩阵
    normalMatrix.setInverseOf(modelMatrix); // 设置模型矩阵的逆矩阵
    normalMatrix.transpose(); // 将模型矩阵的逆矩阵进行转置
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

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
    // 坐标
    var vertices = new Float32Array([
         2.0, 2.0, 2.0,  -2.0, 2.0, 2.0,  -2.0,-2.0, 2.0,   2.0,-2.0, 2.0, // v0-v1-v2-v3 front
         2.0, 2.0, 2.0,   2.0,-2.0, 2.0,   2.0,-2.0,-2.0,   2.0, 2.0,-2.0, // v0-v3-v4-v5 right
         2.0, 2.0, 2.0,   2.0, 2.0,-2.0,  -2.0, 2.0,-2.0,  -2.0, 2.0, 2.0, // v0-v5-v6-v1 up
        -2.0, 2.0, 2.0,  -2.0, 2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0,-2.0, 2.0, // v1-v6-v7-v2 left
        -2.0,-2.0,-2.0,   2.0,-2.0,-2.0,   2.0,-2.0, 2.0,  -2.0,-2.0, 2.0, // v7-v4-v3-v2 down
         2.0,-2.0,-2.0,  -2.0,-2.0,-2.0,  -2.0, 2.0,-2.0,   2.0, 2.0,-2.0  // v4-v7-v6-v5 back
    ]);

    // 颜色
    var colors = new Float32Array([
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
        1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
    ]);

    // 法向量
    var normals = new Float32Array([
         0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
         1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
         0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
         0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
         0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
    ]);

    // 顶点坐标索引
    var indices = new Uint8Array([
         0, 1, 2,   0, 2, 3,    // front
         4, 5, 6,   4, 6, 7,    // right
         8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // Write the vertex property to buffers (coordinates, colors and normals)
    if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create the buffer object');
        return false;
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
    // 创建缓冲区对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // 将数据写入缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 获取attribute变量的存储地址
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log(`Failed to get the storage location of ${a_Attribute}`);
        return false;
    }
    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_Attribute);

    return true;
}