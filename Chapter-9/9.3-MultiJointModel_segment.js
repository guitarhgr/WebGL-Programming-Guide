// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix; // 模型视图矩阵
    uniform mat4 u_NormalMatrix; // 法向量矩阵
    varying vec4 v_Color; // 颜色
    void main () {
        gl_Position = u_MvpMatrix * a_Position; // 位置
        vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7)); // 光照方向
        vec4 color = vec4(1.0, 0.4, 0.0, 1.0); // 颜色
        vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz); // 法向量
        float nDotL = max(dot(normal, lightDirection), 0.0); // 法向量和光照的点积
        v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a); // 计算颜色
    }
`;

// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float; // 设置默认精度
    #endif
    varying vec4 v_Color; // 颜色
    void main () {
        gl_FragColor = v_Color; // 颜色
    }
`;

// 页面加载完成后加载
function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }
    // 设置顶点缓冲
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex buffer information');
        return;
    }
    // 设置清除色和深度缓冲
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // 获取attribute和uniform变量的存储地址
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (a_Position < 0 || !u_MvpMatrix || !u_NormalMatrix) {
        console.log('Failed to get the storage location of attribute or uniform variable');
        return;
    }

    // 创建透视投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(50, canvas.width/canvas.height, 1, 100);
    viewProjMatrix.lookAt(20.0,10.0,30.0,  0.0,0.0,0.0,  0.0,1.0,0.0);
    // 绑定事件
    document.onkeydown = function (event) {
        keyDown(event, gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
    }
    // 绘制图形
    draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
}

var ANGLE_STEP = 3.0; // 角度变化增量
var g_arm1Angle = 90.0; // arm1旋转角度
var g_joint1Angle = 45.0; // joint1旋转角度
var g_joint2Angle = 0.0; // joint2旋转角度
var g_joint3Angle = 0.0; // joint3旋转角度

/**
 * @method
 * @param event 事件上下文
 * @param gl WebGL渲染上下文
 * @param num 渲染次数
 * @param viewProjMatrix 透视投影矩阵
 * @param a_Position 位置存储地址
 * @param u_MvpMatrix 模型视图矩阵存储地址
 * @param u_NormalMatrix 法向量矩阵存储地址
 */
function keyDown(event, gl, num, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
    // 键盘操作
    switch (event.keyCode) {
        case 40: // 上
            if (g_joint1Angle < 135.0) g_joint1Angle += ANGLE_STEP;
            break;
        case 38: // 下
            if (g_joint1Angle > -135.0) g_joint1Angle -= ANGLE_STEP;
            break;
        case 39: // 右
            g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
            break;
        case 37: // 左
            g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
            break;
        case 90: // z
            g_joint2Angle = (g_joint2Angle + ANGLE_STEP) % 360;
            break;
        case 88: // x
            g_joint2Angle = (g_joint2Angle - ANGLE_STEP) % 360;
            break;
        case 86: // v
            if (g_joint3Angle < 60.0) g_joint3Angle = (g_joint3Angle+ ANGLE_STEP) % 360;
            break;
        case 67: // c
            if (g_joint3Angle > -60.0) g_joint3Angle = (g_joint3Angle - ANGLE_STEP) % 360;
            break;
        default: return;
    }
    // 绘制图形
    draw(gl, num, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
}

var g_baseBuffer = null; // base缓冲
var g_arm1Buffer = null; // arm1缓冲
var g_arm2Buffer = null; // arm2缓冲
var g_palmBuffer = null; // palm缓冲
var g_fingerBuffer = null; // fingers缓冲

/**
 * @method 设置顶点缓冲
 * @param gl WebGL渲染上下文
 * @returns {number} 渲染次数
 */
function initVertexBuffers(gl) {
    // base顶点
    var vertices_base = new Float32Array([ // Base(10x2x10)
         5.0, 2.0, 5.0, -5.0, 2.0, 5.0, -5.0, 0.0, 5.0,  5.0, 0.0, 5.0, // v0-v1-v2-v3 front
         5.0, 2.0, 5.0,  5.0, 0.0, 5.0,  5.0, 0.0,-5.0,  5.0, 2.0,-5.0, // v0-v3-v4-v5 right
         5.0, 2.0, 5.0,  5.0, 2.0,-5.0, -5.0, 2.0,-5.0, -5.0, 2.0, 5.0, // v0-v5-v6-v1 up
        -5.0, 2.0, 5.0, -5.0, 2.0,-5.0, -5.0, 0.0,-5.0, -5.0, 0.0, 5.0, // v1-v6-v7-v2 left
        -5.0, 0.0,- 5.0,  5.0, 0.0,-5.0,  5.0, 0.0, 5.0, -5.0, 0.0, 5.0, // v7-v4-v3-v2 down
         5.0, 0.0,-5.0, -5.0, 0.0,-5.0, -5.0, 2.0,-5.0,  5.0, 2.0,-5.0  // v4-v7-v6-v5 back
    ]);
    // arm1顶点
    var vertices_arm1 = new Float32Array([  // Arm1(3x10x3)
         1.5, 10.0, 1.5, -1.5, 10.0, 1.5, -1.5,  0.0, 1.5,  1.5,  0.0, 1.5, // v0-v1-v2-v3 front
         1.5, 10.0, 1.5,  1.5,  0.0, 1.5,  1.5,  0.0,-1.5,  1.5, 10.0,-1.5, // v0-v3-v4-v5 right
         1.5, 10.0, 1.5,  1.5, 10.0,-1.5, -1.5, 10.0,-1.5, -1.5, 10.0, 1.5, // v0-v5-v6-v1 up
        -1.5, 10.0, 1.5, -1.5, 10.0,-1.5, -1.5,  0.0,-1.5, -1.5,  0.0, 1.5, // v1-v6-v7-v2 left
        -1.5,  0.0,-1.5,  1.5,  0.0,-1.5,  1.5,  0.0, 1.5, -1.5,  0.0, 1.5, // v7-v4-v3-v2 down
         1.5,  0.0,-1.5, -1.5,  0.0,-1.5, -1.5, 10.0,-1.5,  1.5, 10.0,-1.5  // v4-v7-v6-v5 back
    ]);
    // arm2顶点
    var vertices_arm2 = new Float32Array([  // Arm2(4x10x4)
         2.0, 10.0, 2.0, -2.0, 10.0, 2.0, -2.0,  0.0, 2.0,  2.0,  0.0, 2.0, // v0-v1-v2-v3 front
         2.0, 10.0,  2.0,  2.0,  0.0, 2.0,  2.0,  0.0,-2.0,  2.0, 10.0,-2.0, // v0-v3-v4-v5 right
         2.0, 10.0, 2.0,  2.0, 10.0,-2.0, -2.0, 10.0,-2.0, -2.0, 10.0, 2.0, // v0-v5-v6-v1 up
        -2.0, 10.0, 2.0, -2.0, 10.0,-2.0, -2.0,  0.0,-2.0, -2.0,  0.0, 2.0, // v1-v6-v7-v2 left
        -2.0,  0.0,-2.0,  2.0,  0.0,-2.0,  2.0,  0.0, 2.0, -2.0,  0.0, 2.0, // v7-v4-v3-v2 down
         2.0,  0.0,-2.0, -2.0,  0.0,-2.0, -2.0, 10.0,-2.0,  2.0, 10.0,-2.0  // v4-v7-v6-v5 back
    ]);
    // palm顶点
    var vertices_palm = new Float32Array([  // Palm(2x2x6)
         1.0, 2.0, 3.0, -1.0, 2.0, 3.0, -1.0, 0.0, 3.0,  1.0, 0.0, 3.0, // v0-v1-v2-v3 front
         1.0, 2.0, 3.0,  1.0, 0.0, 3.0,  1.0, 0.0,-3.0,  1.0, 2.0,-3.0, // v0-v3-v4-v5 right
         1.0, 2.0, 3.0,  1.0, 2.0,-3.0, -1.0, 2.0,-3.0, -1.0, 2.0, 3.0, // v0-v5-v6-v1 up
        -1.0, 2.0, 3.0, -1.0, 2.0,-3.0, -1.0, 0.0,-3.0, -1.0, 0.0, 3.0, // v1-v6-v7-v2 left
        -1.0, 0.0,-3.0,  1.0, 0.0,-3.0,  1.0, 0.0, 3.0, -1.0, 0.0, 3.0, // v7-v4-v3-v2 down
         1.0, 0.0,-3.0, -1.0, 0.0,-3.0, -1.0, 2.0,-3.0,  1.0, 2.0,-3.0  // v4-v7-v6-v5 back
    ]);
    // finger顶点
    var vertices_finger = new Float32Array([  // Fingers(1x2x1)
         0.5, 2.0, 0.5, -0.5, 2.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
         0.5, 2.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 2.0,-0.5, // v0-v3-v4-v5 right
         0.5, 2.0, 0.5,  0.5, 2.0,-0.5, -0.5, 2.0,-0.5, -0.5, 2.0, 0.5, // v0-v5-v6-v1 up
        -0.5, 2.0, 0.5, -0.5, 2.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
        -0.5, 0.0,-0.5,   0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
         0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 2.0,-0.5,  0.5, 2.0,-0.5  // v4-v7-v6-v5 back
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
    // 初始化缓冲
    g_baseBuffer = initArrayBufferForLaterUse(gl, vertices_base, 3, gl.FLOAT);
    g_arm1Buffer = initArrayBufferForLaterUse(gl, vertices_arm1, 3, gl.FLOAT);
    g_arm2Buffer = initArrayBufferForLaterUse(gl, vertices_arm2, 3, gl.FLOAT);
    g_palmBuffer = initArrayBufferForLaterUse(gl, vertices_palm, 3, gl.FLOAT);
    g_fingerBuffer = initArrayBufferForLaterUse(gl, vertices_finger, 3, gl.FLOAT);

    if (!g_baseBuffer || !g_arm1Buffer || !g_arm2Buffer || !g_palmBuffer || !g_fingerBuffer) {
        console.log('Failed to create buffer object');
        return -1;
    }

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
 * @method 初始化缓冲等会儿使用
 * @param gl WebGL渲染上下文
 * @param data 数据
 * @param num 数据分割量
 * @param type 数据类型
 * @returns {WebGLBuffer} 缓冲对象
 */
function initArrayBufferForLaterUse(gl, data, num, type) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer object');
        return null;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据传给缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 将num和type绑定到buffer上面 TODO 这样不好
    buffer.num = num;
    buffer.type = type;

    return buffer;
}

/**
 * @method 设置ArrayBuffer
 * @param gl WebGL渲染上下文
 * @param attribute 属性值
 * @param data 数据
 * @param num 分个量
 * @param type 数据类型
 * @returns {boolean} 是否初始化成功
 */
function initArrayBuffer(gl, attribute, data, num, type) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer object');
        return false;
    }

    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据传给缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 获取attribute存储地址
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log(`Failed to get the storage location of ${attribute}`);
        return false;
    }
    // 将缓冲区与attribute变量关联
    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    // 开启attribute
    gl.enableVertexAttribArray(a_Attribute);

    return true;
}

var g_modelMatrix = new Matrix4(); // 模型矩阵
var g_mvpMatrix = new Matrix4(); // 模型视图矩阵

/**
 * @method 绘制
 * @param gl WebGL渲染上下文
 * @param n 渲染次数
 * @param viewProjMatrix 透视投影矩阵
 * @param a_Position 位置
 * @param u_MvpMatrix uniform存储地址
 * @param u_NormalMatrix uniform存储地址
 */
function draw(gl, n, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制base
    var baseHeight = 2.0;
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
    drawSegment(gl, n, g_baseBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

    // 绘制arm1
    var arm1Length = 10.0;
    g_modelMatrix.translate(0.0, baseHeight, 0.0);
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0); // y-axis
    drawSegment(gl, n, g_arm1Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

    // 绘制arm2
    var arm2Length = 10.0;
    g_modelMatrix.translate(0.0, arm1Length, 0.0);
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0, 1.0); // z-axis
    drawSegment(gl, n, g_arm2Buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

    // 绘制palm
    var palmLength = 2.0;
    g_modelMatrix.translate(0.0, arm2Length, 0.0);
    g_modelMatrix.rotate(g_joint2Angle, 0.0, 1.0, 0.0); // y-axis
    drawSegment(gl, n, g_palmBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);

    g_modelMatrix.translate(0.0, palmLength, 0.0);
    // 绘制finger1
    pushMatrix(g_modelMatrix);
        g_modelMatrix.translate(0.0, 0.0, 2.0);
        g_modelMatrix.rotate(g_joint3Angle, 1.0, 0.0, 0.0); // x-axis
        drawSegment(gl, n, g_fingerBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
    g_modelMatrix = popMatrix();
    // 绘制finger2
    g_modelMatrix.translate(0.0, 0.0, -2.0);
    g_modelMatrix.rotate(-g_joint3Angle, 1.0, 0.0, 0.0);
    drawSegment(gl, n, g_fingerBuffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix);
}

// 矩阵栈
var g_matrixStack = [];
/**
 * @method 矩阵入栈
 * @param m 矩阵
 */
function pushMatrix(m) {
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}
/**
 * @method 矩阵出栈
 * @returns {*}
 */
function popMatrix() {
    return g_matrixStack.pop();
}

// 法向量矩阵
var g_normalMatrix = new Matrix4();

/**
 * @method 绘制片段
 * @param gl WebGL渲染上下文
 * @param n 绘制次数
 * @param buffer WebGL缓冲对象
 * @param viewProjMatrix 透视投影矩阵
 * @param a_Position 位置
 * @param u_MvpMatrix 模型视图矩阵位置
 * @param u_NormalMatrix 法向量矩阵位置
 */
function drawSegment(gl, n, buffer, viewProjMatrix, a_Position, u_MvpMatrix, u_NormalMatrix) {
    // 绑定缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将缓冲分配给a_Position
    gl.vertexAttribPointer(a_Position, buffer.num, buffer.type, false, 0, 0);
    // 开启a_Position
    gl.enableVertexAttribArray(a_Position);
    // 设置模型视图矩阵
    g_mvpMatrix.set(viewProjMatrix); // 设置透视投影矩阵设置到模型视图矩阵中
    g_mvpMatrix.multiply(g_modelMatrix); // 将模型视图矩阵*模型矩阵
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements); // 设置法向量矩阵
    g_normalMatrix.setInverseOf(g_modelMatrix); // 求法向量矩阵的逆矩阵
    g_normalMatrix.transpose(); // 法向量的逆矩阵转置
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);// 绘制
}