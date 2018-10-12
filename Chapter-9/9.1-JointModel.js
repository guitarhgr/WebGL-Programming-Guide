// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix; // 模型视图矩阵
    uniform mat4 u_NormalMatrix; // 法向量矩阵
    varying vec4 v_Color; // 颜色
    void main () {
        gl_Position = u_MvpMatrix * a_Position; // 计算位置: 视图矩阵 * 位置
        vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7)); // 计算光照方向(归一化)
        vec4 color = vec4(1.0, 0.4, 0.0, 1.0); // 设置颜色
        vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz); // 计算法向量
        float nDotL = max(dot(normal, lightDirection), 0.0); // 计算光线方向和法向量的点积
        v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a); // 计算颜色
    }
`;
// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    varying vec4 v_Color; // 颜色
    void main () {
        gl_FragColor = v_Color;
    }
`;

// 页面加载完成后执行
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

    // 设置顶点数据缓冲
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex buffer');
        return;
    }

    // 设置清除色和深度测试
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 获取uniform的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_MvpMatrix || !u_NormalMatrix) {
        console.log('Failed to get the uniform storage location of u_MvpMatrix or u_NormalMatrix');
        return;
    }
    // 透视投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(50.0, canvas.width/canvas.height, 1, 100);
    viewProjMatrix.lookAt(20.0,10.0,30.0,  0.0,0.0,0.0,  0.0,1.0,0.0);

    // 绑定事件
    document.onkeydown = function (event) {
        keyDown(event, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    };

    // 绘制图形
    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

var ANGLE_STEP = 3.0; // 角度变化值
var g_arm1Angle = -90.0; // arm1的旋转角度
var g_joint1Angle = 0.0; // joint1旋转的角度

/**
 * @method 键盘按下响应事件
 * @param event {Object} 事件上下文
 * @param gl {Object} WebGL渲染上下文
 * @param n {number} 渲染次数
 * @param viewProjMatrix {Object} 视图矩阵
 * @param u_MvpMatrix  // 模型视图矩阵地址
 * @param u_NormalMatrix // 法向量矩阵地址
 */
function keyDown(event, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    switch (event.keyCode) {
        case 38: // 上
            if (g_joint1Angle < 135.0) g_joint1Angle += ANGLE_STEP;
            break;
        case 40: // 下
            if (g_joint1Angle > -135.0) g_joint1Angle -= ANGLE_STEP;
            break;
        case 39: // 右
            g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
            break;
        case 37: // 左
            g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
            break;
        default:
            return;
    }
    // 绘制arm
    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

/**
 * @method 设置顶点缓冲
 * @param gl {Object} WebGL渲染上下文
 * @returns {number} 渲染次数
 */
function initVertexBuffers(gl) {
    // 位置
    var vertices = new Float32Array([
         1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5,  0.0, 1.5,  1.5,  0.0, 1.5, // v0-v1-v2-v3 front
         1.5, 10.0, 1.5,  1.5,  0.0, 1.5,  1.5,  0.0,-1.5,  1.5, 10.0,-1.5, // v0-v3-v4-v5 right
         1.5, 10.0, 1.5,  1.5, 10.0,-1.5, -1.5, 10.0,-1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
        -1.5, 10.0, 1.5, -1.5, 10.0,-1.5, -1.5,  0.0,-1.5, -1.5,  0.0, 1.5, // v1-v6-v7-v2 left
        -1.5,  0.0,-1.5,  1.5,  0.0,-1.5,  1.5,  0.0, 1.5, -1.5,  0.0, 1.5, // v7-v4-v3-v2 down
         1.5,  0.0,-1.5, -1.5,  0.0,-1.5, -1.5, 10.0,-1.5,  1.5, 10.0,-1.5  // v4-v7-v6-v5 back
    ]);
    // 法向量
    var normals = new Float32Array([
         0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
         1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
         0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
         0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
         0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
    ]);
    // 顶点索引
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);
    // 设置位置缓冲
    if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
    // 设置法向量缓冲
    if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;
    // 设置顶点索引到缓冲
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
 * @method 设置ArrayBuffer
 * @param gl {Object} WebGL渲染上下文
 * @param attribute {String} 属性名
 * @param data {Float32Array} 数据
 * @param type 类型
 * @param num {Number} 数据数量
 * @returns {boolean} 是否设置成功
 */
function initArrayBuffer(gl, attribute, data, type, num) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer object');
        return false;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 设置缓冲区数据
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 获取attribute的存储地址
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log(`Failed to get storage location of ${attribute}`);
        return false;
    }
    // 将缓冲分配个attribute
    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    // 开启缓冲
    gl.enableVertexAttribArray(a_Attribute);
    return true;
}

var g_modelMatrix= new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

/**
 * @method 绘制图形
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 渲染次数
 * @param viewProjMatrix {Object} 视图矩阵
 * @param u_MvpMatrix 模型视图矩阵存储地址
 * @param u_NormalMatrix 法向量矩阵存储地址
 * @returns {number} 渲染次数
 */
function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // Arm1
    var arm1Length = 10.0;// arm1长度
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);// 设置平移
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0);// 旋转
    drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);// 绘制

    // Arm2
    g_modelMatrix.translate(0.0, arm1Length, 0.0);// 平移
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0);// 旋转
    g_modelMatrix.scale(1.3, 1.0, 1.3)// 缩放
    drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);// 绘制
}

// 绘制立方体
/**
 *
 * @param gl WebGL渲染上下文
 * @param n {Number}
 * @param viewProjMatrix {}
 * @param u_MvpMatrix {WebGLUniformLocation}
 * @param u_NormalMatrix {FloatArray32|Any}
 */
function drawBox(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    // 设置视图矩阵
    g_mvpMatrix.set(viewProjMatrix);
    // 与模型矩阵相乘
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // 设置法向量矩阵的逆矩阵
    g_normalMatrix.setInverseOf(g_modelMatrix);
    // 法向量的逆矩阵转置
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    // 绘制图形
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}