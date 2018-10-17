// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix; // 视图矩阵
    uniform mat4 u_NormalMatrix; // 法向量矩阵
    varying vec4 v_Color; // 传递颜色
    void main () {
        gl_Position = u_MvpMatrix * a_Position; // 位置
        vec3 lightDirection = normalize(vec3(0.0, 0.5, 0.7)); // 光照方向
        vec4 color = vec4(1.0, 0.4, 0.0, 1.0); // 颜色
        vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz); // 法向量
        float nDotL = max(dot(normal, lightDirection), 0.0); // 法向量和光照的点积
        v_Color = vec4(color.rgb * nDotL + vec3(0.1), color.a); // 颜色
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

/**
 * @method 页面加载完成执行函数
 */
function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
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
    // 设置顶点数据缓冲
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // 设置颜色、开启深度测试(消除隐藏面)
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    // 获取uniform变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    if (!u_MvpMatrix || !u_NormalMatrix) {
        console.log('Failed to get the storage location of u_MvpMatrix or u_NormalMatrix');
        return;
    }

    // 创建变换矩阵
    var viewProjMatrix = new Matrix4(); // 创建透视投影矩阵
    viewProjMatrix.setPerspective(50.0, canvas.width/canvas.height, 1.0, 100.0); // 设置透视投影
    viewProjMatrix.lookAt(20.0,10.0,30.0,  0.0,0.0,0.0,  0.0,1.0,0.0) // 设置朝向
    // 绑定事件
    document.onkeydown = function (event) {
        keyDown(event, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    }
    // 绘制图形
    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

var ANGLE_STEP = 3.0; // 旋转角度增量
var g_arm1Angle = 90.0; // arm1旋转角度
var g_joint1Angle = 45.0;  // joint1旋转角度
var g_joint2Angle = 0.0; // join2旋转角度
var g_joint3Angle = 0.0; // joint3旋转角度

/**
 * @method 键盘按下事件
 * @param event {Object} 事件上下文
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 渲染次数
 * @param viewProjMatrix {Object} 透视投影矩阵
 * @param u_MvpMatrix {Object} 存储地址
 * @param u_NormalMatrix {Object} 存储地址
 */
function keyDown(event, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    switch (event.keyCode) {
        case 40: // 上
            if (g_joint1Angle < 135.0) { g_joint1Angle += ANGLE_STEP; }
            break;
        case 38: // 下
            if (g_joint1Angle > -135.0) { g_joint1Angle -= ANGLE_STEP; }
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
            g_joint3Angle = (g_joint3Angle + ANGLE_STEP) % 360;
            break;
        case 67: // c
            g_joint3Angle = (g_joint3Angle + ANGLE_STEP) % 360;
            break;
        default:
            return;
    }
    draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

/**
 * @method 设置顶点数据缓冲
 * @param gl {Object} WebGL渲染上下文
 * @returns {number} 渲染次数
 */
function initVertexBuffers(gl) {
    // 坐标
    var vertices = new Float32Array([
         0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
         0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
         0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
        -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
        -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
         0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
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

    if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
    if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;

    // 解除缓冲绑定
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create index buffer');
        return -1;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

/**
 * @method
 * @param {Object} gl
 * @param {String} attribute
 * @param {Object} data
 * @param type
 * @param {Number} num
 * @returns {boolean}
 */
function initArrayBuffer(gl, attribute, data, type, num) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create vertex buffer object');
        return;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 向缓冲区传递数据
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // 获取attribute变量
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log(`Failed to get the storage location of ${attribute}`);
        return;
    }
    // 将缓冲区关联attribute
    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    // 开启attribute
    gl.enableVertexAttribArray(a_Attribute);

    return true;
}
// 绘制图形
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();

/**
 * @method 绘制图形
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 渲染次数
 * @param viewProjMatrix {Object} 透视投影矩阵
 * @param u_MvpMatrix {Object} 存储地址
 * @param u_NormalMatrix {Object} 存储地址
 */
function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    // 清除颜色、深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制底座
    var baseHeight = 2.0;
    g_modelMatrix.setTranslate(0.0, -12.0, 0.0);
    drawBox(gl, n, 10.0, baseHeight, 10.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    // 绘制Arm1
    var arm1Length = 10.0;
    g_modelMatrix.translate(0.0, baseHeight, 0.0);
    g_modelMatrix.rotate(g_arm1Angle, 0.0, 1.0, 0.0);
    drawBox(gl, n, 3.0, arm1Length, 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    // 绘制Arm2
    var arm2length = 10.0;
    g_modelMatrix.translate(0.0, arm1Length, 0.0);
    g_modelMatrix.rotate(g_joint1Angle, 0.0, 0.0);
    drawBox(gl, n, 4.0, arm2length, 4.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    // 绘制palm
    var palmLength = 2.0;
    g_modelMatrix.translate(0.0, arm2length, 0.0);
    g_modelMatrix.rotate(g_joint2Angle, 0.0, 1.0, 0.0);
    drawBox(gl, n, 2.0, palmLength, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

    // 移动中心点到palm
    g_modelMatrix.translate(0.0, palmLength, 0.0);

    // 绘制finger1
    pushMatrix(g_modelMatrix);
        g_modelMatrix.translate(0.0, 0.0, 2.0);
        g_modelMatrix.rotate(g_joint3Angle, 1.0, 0.0, 0.0);
        drawBox(gl, n, 1.0, 2.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
    g_modelMatrix = popMatrix();

    // 绘制finger2
    g_modelMatrix.translate(0.0, 0.0, -2.0);
    g_modelMatrix.rotate(-g_joint3Angle, 1.0, 0.0, 0.0);
    drawBox(gl, n, 1.0, 2.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

var g_matrixStack = []; // 存储矩阵的栈

/**
 * @method 入栈
 * @param m
 */
function pushMatrix(m) {
    var m2 = new Matrix4(m);
    g_matrixStack.push(m2);
}

/**
 * @method 出栈
 * @returns {*}
 */
function popMatrix() {
    return g_matrixStack.pop();
}
var g_normalMatrix = new Matrix4();

/**
 * @method 绘制几何体
 * @param gl {Object} WebGL渲染上下文
 * @param n {Number} 绘制次数
 * @param width {Number} 宽度
 * @param height {Number} 高度
 * @param depth {Number} 深度
 * @param viewProjMatrix {Object} 透视投影矩阵
 * @param u_MvpMatrix 模型视图矩阵存储地址
 * @param u_NormalMatrix 法向量矩阵存储地址
 */
function drawBox(gl, n, width, height, depth, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
    pushMatrix(g_modelMatrix);
        g_modelMatrix.scale(width, height, depth);
        g_mvpMatrix.set(viewProjMatrix);
        g_mvpMatrix.multiply(g_modelMatrix);
        gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

        g_normalMatrix.setInverseOf(g_modelMatrix);
        g_normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

        gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
    g_modelMatrix = popMatrix();
}