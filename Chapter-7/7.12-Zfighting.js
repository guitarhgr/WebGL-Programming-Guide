// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_ViewProjMatrix;
    varying vec4 v_Color;
    void main () {
        gl_Position = u_ViewProjMatrix * a_Position;
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
        return;
    }
    // 设置顶点数据到缓冲区
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to get set the vertex information');
        return;
    }
    // 设置<canvas>清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 开启深度测试
    gl.enable(gl.DEPTH_TEST);
    // 获取u_ViewProjMatrix的存储位置
    var u_ViewProjMatrix = gl.getUniformLocation(gl.program, 'u_ViewProjMatrix');
    if (!u_ViewProjMatrix) {
        console.log('Failed to get storage location of u_ViewProjMatrix');
        return;
    }
    // 创建投影视图矩阵
    var viewProjMatrix = new Matrix4();
    // 设置透视相机矩阵
    viewProjMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
    // 设置视点矩阵
    viewProjMatrix.lookAt(3.06,2.5,10.0,  0,0,-2,  0,1,0);
    // 设置透视矩阵到变量u_ViewProjMatrix
    gl.uniformMatrix4fv(u_ViewProjMatrix, false, viewProjMatrix.elements);
    // 清除颜色和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 开启多边形偏移
    gl.enable(gl.POLYGON_OFFSET_FILL);
    // 绘制三角形
    gl.drawArrays(gl.TRIANGLES, 0, n/2); // 绿色三角形
    // 设置多边形偏移的偏移量
    gl.polygonOffset(1.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, n/2, n/2); // 黄色三角形
}

/**
 * 设置顶点数据到缓冲区中
 * @param gl {object} WebGL渲染上下文
 * @returns {number} 顶点数量
 */
function initVertexBuffers(gl) {
    // 创建顶点数据(坐标、颜色)的浮点类型数组
    var verticesColors = new Float32Array([
         0.0,  2.5, -5.0,    0.4, 1.0, 0.4,  // The green triangle
        -2.5, -2.5, -5.0,    0.4, 1.0, 0.4,
         2.5, -2.5, -5.0,    1.0, 0.4, 0.4,

         0.0,  3.0, -5.0,    1.0, 0.4, 0.4,  // The yellow triangle
        -3.0, -3.0, -5.0,    1.0, 1.0, 0.4,
         3.0, -3.0, -5.0,    1.0, 1.0, 0.4,
    ]);

    var n = 6;

    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to crete the vertex buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将顶点数据存入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
    // 获取顶点字节大小
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // 获取顶点着色器中a_Position的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position'),
        a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if (a_Position < 0 || a_Color < 0) {
        console.log('Failed to get the storage location of a_Position or a_Color');
        return -1;
    }
    // 分配缓冲区
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE*6, 0);
    // 开启变量
    gl.enableVertexAttribArray(a_Position);

    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*6, FSIZE*3);
    gl.enableVertexAttribArray(a_Color);
    return n;
}

/**划重点
 * 1. 深度冲突：
 *      隐藏面消除是WebGL的一项复杂而又强大的特性，在绝大多数情况下，它都能很好的完成任务。然而，当几何图形或物体的
 *      两个表面极为接近时，就会出现新的问题，使得表面看上去斑斑驳驳的。这种现象称为深度冲突。
 * 2.产生深度冲突的原因：
 *      因为两个表面过于接近，深度缓冲区有限的精度已经不能区分哪个在前，哪个在后了。严格的说，如果创建三维模型阶段就
 *      对顶点的深度值加以注意，是能够避免深度冲突的。但是，当场景中有多个运动着的物体时，实现这一点几乎是不可能的。
 * 3. 多边形偏移(polygon offset)：
 *      解决深度冲突，该机制将自动在Z值加上一个偏移量，偏移量的值由物体表面相对于观察者视线的角度来确定。
 * 4. 启动多边形偏移：
 *      a. 启动多边形偏移: gl.enable(gl.POLYGON_OFFSET_FILL)；
 *      b. 在绘制前指定用来计算偏移量的参数： gl.polygonOffset(1.0, 1.0);
 *
 * */