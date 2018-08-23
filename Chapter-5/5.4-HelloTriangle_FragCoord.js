/**几何图形的装配和光栅化*/
// 顶点着色器
var  VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform float u_Width;\n' +
    'uniform float u_Height;\n' +
    'void main() {\n' +
    '   gl_FragColor = vec4(gl_FragCoord.x/u_Width, 0.0, gl_FragCoord.y/u_Height, 1.0);\n' +
    '}\n';
// 主程序
function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取WebGL渲染上下文
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
    // 设置点的位置和颜色
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex positions');
        return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, n);
}
// 设置顶点数据
function initVertexBuffers(gl) {
    // 创建顶点数据的类浮点数据
    var vertices = new Float32Array([
        0.0,0.5,  -0.5,-0.5,  0.5,-0.5
    ]);
    var n = 3; // 设置顶点数量
    // 创建缓冲区
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the vertex buffer object');
        return -1;
    }
    // 绑定缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // 将顶点数据写入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage position of the a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

    var u_Width = gl.getUniformLocation(gl.program, 'u_Width');
    var u_Height = gl.getUniformLocation(gl.program, 'u_Height');
    if (!u_Height || !u_Width) {
        console.log('Failed to get storage position of the u_Width or u_Height');
        return -1;
    }

    gl.uniform1f(u_Width, gl.drawingBufferWidth);
    gl.uniform1f(u_Height, gl.drawingBufferHeight);

    gl.enableVertexAttribArray(a_Position);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
}

/**划重点
 * 1.图形装配过程: 这一个的任务是，将孤立的顶点坐标装配成几何图形。几个图形的类型由gl.drawArrays()函数的第一个参数决定
 * 2.光栅化过程: 这一步的任务是，将装配好的几何图形转化为片元
 * 3.图元: 被装配出的基本图形(点、线、面)
 * 4.光栅化过程后，是逐片元调用片元着色器，写入缓冲区，到最后一个片元被处理完成后，浏览器就会显示最终结果。
 * 5.顶点着色器中的v_Color变量在传入片元着色器之前经过了内插过程,片元着色器中的v_Color变量和顶点着色器中的v_Color变量实际不是一回事
 * 6.内插过程: 所有的片元的颜色值都会被恰当地计算出来。 一旦两点之间每个片元的新颜色都通过内插过程被计算出来后，它们就会被传给片元着色
 * 器中的v_Color变量
 * */