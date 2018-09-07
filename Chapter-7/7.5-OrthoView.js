// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ProjMatrix;
    varying vec4 v_Color;
    void main () {
        gl_Position = u_ProjMatrix * a_Position;
        v_Color = a_Color;
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

function main() {
    // 获取DOM节点
    var canvas = document.querySelector('#webgl'),
        nearFar = document.querySelector('#nearFar');
    // 获得WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize the shaders');
        return;
    }
    // 设置顶点数据缓冲
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex buffer');
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 获取u_ProjMatrix的存储地址
    var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
    if (!u_ProjMatrix) {
        console.log('Failed to get the storage location of u_ProjMatrix');
        return;
    }
    var projMatrix = new Matrix4();
    // 注册键盘事件响应函数
    document.onkeydown = function (event) {
        changeViewNearOrFar(event, gl, n, u_ProjMatrix, projMatrix, nearFar);
    }
    drawView(gl, n, u_ProjMatrix, projMatrix, nearFar);
}

/**
 * 设置顶点数据
 * @param gl {object} WebGL渲染上下文
 * @returns {number} 顶点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据的浮点类型数组
    var verticesColor = new Float32Array([
         0.0,  0.6, -0.4,    0.4, 1.0, 0.4,
        -0.5, -0.4, -0.4,    0.4, 1.0, 0.4,
         0.5, -0.4, -0.4,    1.0, 0.4, 0.4,

         0.5,  0.4, -0.2,    1.0, 0.4, 0.4,
        -0.5,  0.4, -0.2,    1.0, 1.0, 0.4,
         0.0, -0.6, -0.2,    1.0, 1.0, 0.4,

         0.0,  0.5,  0.0,    0.4, 0.4, 1.0,
        -0.5, -0.5,  0.0,    0.4, 0.4, 1.0,
         0.5, -0.5,  0.0,    1.0, 0.4, 0.4
    ]);

    var n = 9; // 设置顶点数量
    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create vertex buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将顶点数据存入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesColor, gl.STATIC_DRAW);
    // 字节大小
    var FSIZE = verticesColor.BYTES_PER_ELEMENT;
    // 获取顶点坐标和颜色的存储地址
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position'),
        a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Position < 0 || a_Color < 0) {
        console.log('Failed to get the storage location of a_Position or a_Color');
        return -1;
    }
    // 将缓冲区对象分配给一个变量
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6, 0);
    // 开启变量
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);

    return n;
}

// 视点与近、远裁剪面的距离
var g_near = 0.0, g_far = 0.5;
/**
 * 改变视点的near/far
 * @param event {object} 事件对象
 * @param gl {object} WebGL渲染上下文
 * @param n {number} 顶点数量
 * @param u_ProjMatrix {object} 矩阵的存储地址
 * @param projMatrix {object} 矩阵
 * @param nfElement {object} DOM节点
 */
function changeViewNearOrFar(event, gl, n, u_ProjMatrix, projMatrix, nfElement) {
    switch (event.keyCode) {
        case 39:  // 右
            g_near += 0.01;
            break;
        case 37:  // 左
            g_near -= 0.01;
            break;
        case 38:  // 上
            g_far += 0.01;
            break;
        case 40:  // 下
            g_far -= 0.01;
            break;
        default: // 其他
            return;
    }
    drawView(gl, n, u_ProjMatrix, projMatrix, nfElement);
}

/**
 * 绘制图形
 * @param gl {object} WebGL渲染上下文
 * @param n {number} 顶点数量
 * @param u_ProjMatrix {object} 矩阵的存储地址
 * @param projMatrix {object} 矩阵
 * @param nfElement {object} DOM节点
 */
function drawView(gl, n, u_ProjMatrix, projMatrix, nfElement) {
    // 使用矩阵设置可视空间
    projMatrix.setOrtho(-1, 1, -1, 1, g_near, g_far);
    // 将投影矩阵传给u_ProjMatrix变量
    gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    nfElement.innerHTML = `near: ${Math.round(g_near*100)/100}, far: ${Math.round(g_far*100)/100};`;
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

/**划重点
 * 1. 可视范围：既实际观察得到的区域边界。
 * 2. 正射类型可视范围：
 *      虽然可以将三维物体放在三维空间中的任何地方，但是只有当它在可视范围内时，WebGL才会绘制它。事实上，不绘制可视范围外的对象，
 *      是基本的降低程序开销的手段。绘制可视范围外的对象没有意义，即使把它们绘制出来也不会在屏幕上显示。从某种程序上来说，这样做
 *      也模拟了人类观察物体的方式。人类也只能看到眼前的东西，水平视角大约200度左右。总之WebGL只绘制可视范围内的三维对象。
 * 3. 可视空间：包括水平视角，垂直视角和可视深度
 * 4. 可视空间类型：
 *      a.长方体可视空间，也称盒状空间，由正射投影(orthographic projection)产生。
 *      b.四棱锥/金字塔可视空间，由透视投影(perspective projection)产生。
 * 5. 盒状可视空间的工作原理：
 *      可视空间由前后两个矩形表面确定，分别称近裁剪面(near clipping plane)和远裁剪面(far clipping plane)。
 *      近裁剪面的四个顶点为：
 *          (right, top, -near), (-left, top, -near), (-left, -bottom, -near), (right, -bottom, -near)
 *      远裁剪面的四个顶点为：
 *          (right, top, far), (-left, top, far), (-left, -bottom, far), (right, -bottom, far)
 *      <canvas>上显示的就是可视空间中物体在近裁剪面上的投影。如果裁剪面的宽高比和<canvas>不一样，那么画面就会被按照<canvas>的
 *      宽高比进行压缩，物体会被扭曲。近裁剪面与远裁剪面之间的盒形空间就是可视空间，只有在此空间内的物体会被显示出来。如果某个物
 *      体一部分在可视空间内，一部分在其外，那就只显示空间内的部分。
 *
 * */