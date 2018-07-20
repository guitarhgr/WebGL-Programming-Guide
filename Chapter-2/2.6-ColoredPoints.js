// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   gl_PointSize = 10.0;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '   gl_FragColor = u_FragColor;\n' +
    '}\n';

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
        console.log('Failed to initialize shaders.');
        return;
    }
    // 获取a_Position变量的存储位置
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }
    // 获取u_FragColor变量的存储位置
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    // 注册鼠标点击事件响应函数
    canvas.onmousedown = function (event) {
        click(event, gl, canvas, a_Position, u_FragColor);
    };
    // 设置<canvas>背景色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清除<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

var g_points = []; // 存储鼠标点击位置的数组
var g_colors = [];  // 存储点颜色的数组

function click(event, gl, canvas, a_Position, u_FragColor) {
    // 获取点坐标
    var x = event.clientX;
    var y = event.clientY;
    var rect = event.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2) / (canvas.width/2);
    y = (canvas.height/2 - (y - rect.top)) / (canvas.height/2);
    // 将坐标存储到g_points数组中
    g_points.push([x, y]);
    // 将点的颜色存储到g_color数组中
    // 判断象限
    if (x >= 0.0 && y >= 0.0) { // 第一象限
        g_colors.push([1.0, 0.0, 0.0, 1.0]); // 红色
    } else if (x < 0.0 && y > 0.0) { // 第二象限
        g_colors.push([0.0, 1.0, 0.0, 1.0]); // 绿色
    } else if (x < 0.0 && y < 0.0) { // 第三象限
        g_colors.push([0.0, 0.0, 1.0, 1.0]); // 蓝色
    } else { // 第四象限
        g_colors.push([1.0, 1.0, 1.0, 1.0]); // 白色
    }

    // 清空<canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 循环遍历将点
    for (var i = 0, len = g_points.length; i < len; i++) {
        var xy = g_points[i]; // 点位置
        var rgba = g_colors[i]; // 颜色

        gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0); // 点的位置传输到a_Position变量中
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]); // 点的颜色传输到u_FragColor变量中
        // 绘制
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}