// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Color; // 颜色
    uniform mat4 u_MvpMatrix; // 视图矩阵
    uniform bool u_Clicked; // 点击
    varying vec4 v_Color; // 传递颜色
    void main () {
        gl_Position = u_MvpMatrix * a_Position; // 计算位置
        // 判断点击 改变颜色
        if (u_Clicked) {
            v_Color = vec4(1.0, 0.0, 0.0, 1.0);
        } else {
            v_Color = a_Color;
        }
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

var ANGLE_STEP = 20.0;

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
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders');
        return;
    }

    // 设置顶点缓冲
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set vertex information');
        return;
    }
    // 设置清除颜色和开始深度测试
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 获取attribute和uniform变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
    if (!u_MvpMatrix || !u_Clicked) {
        console.log('Failed to get storage location of the uniform');
        return;
    }
    // 创建视图投影矩阵
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0);
    viewProjMatrix.lookAt(0.0,0.0,7.0,   0.0,0.0,0.0,  0.0,1.0,0.0);

    // 设置点击
    gl.uniform1i(u_Clicked, 0);

    var currentAngle = 0.0;

    // 绑定事件处理函数
    canvas.onmousedown = function (event) {
        var x = event.clientX;
        var y = event.clientY;
        var rect = event.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right &&
            rect.top  <= y && y < rect.bottom) {
            var x_in_canvas = x - rect.left;
            var y_in_canvas = rect.bottom - y;
            var picked = check(gl, n, x_in_canvas, y_in_canvas, currentAngle, u_Clicked, viewProjMatrix, u_MvpMatrix);
            if (picked) {
                alert('The cube was selected');
            }
        }
    }
    // 创建循环函数
    var tick = function () {
        currentAngle = animate(currentAngle);
        draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
        requestAnimationFrame(tick);
    };

    tick();
}

function initVertexBuffers(gl) {
    // 顶点数据
    var vertices = new Float32Array([   // Vertex coordinates
         1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
         1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
         1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
         1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);
    // 颜色
    var colors = new Float32Array([   // Colors
         0.2, 0.58, 0.82,   0.2, 0.58, 0.82,   0.2, 0.58, 0.82,   0.2, 0.58, 0.82, // v0-v1-v2-v3 front
         0.5, 0.41, 0.69,   0.5, 0.41, 0.69,   0.5, 0.41, 0.69,   0.5, 0.41, 0.69,  // v0-v3-v4-v5 right
         0.0, 0.32, 0.61,   0.0, 0.32, 0.61,   0.0, 0.32, 0.61,   0.0, 0.32, 0.61,  // v0-v5-v6-v1 up
        0.78, 0.69, 0.84,  0.78, 0.69, 0.84,  0.78, 0.69, 0.84,  0.78, 0.69, 0.84, // v1-v6-v7-v2 left
        0.32, 0.18, 0.56,  0.32, 0.18, 0.56,  0.32, 0.18, 0.56,  0.32, 0.18, 0.56, // v7-v4-v3-v2 down
        0.73, 0.82, 0.93,  0.73, 0.82, 0.93,  0.73, 0.82, 0.93,  0.73, 0.82, 0.93, // v4-v7-v6-v5 back
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

    // 设置数据缓冲
    if (!initArrayBuffer(gl, vertices, gl.FLOAT, 3, 'a_Position' )) return -1;
    if (!initArrayBuffer(gl, colors, gl.FLOAT, 3, 'a_Color')) return -1;

    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create index buffer object');
        return -1;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}



function initArrayBuffer(gl, data, type, num, attribute) {
    // 创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer object');
        return false;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 将缓冲分配给attribute变量
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_Attribute);

    return true;
}

function check(gl, n, x, y, currentAngle, u_Clicked, viewProjMatrix, u_MvpMatrix) {
    var picked = false;
    gl.uniform1i(u_Clicked, 1); // 设置u_Click为true
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);
    // 读取点击像素位置
    var pixels = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    if (pixels[0] === 255) {
        picked = true;
    }
    gl.uniform1i(u_Clicked, 0);
    draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix);

    return picked;
}

var g_MvpMatrix = new Matrix4(); // 模型视图透视矩阵
function draw(gl, n, currentAngle, viewProjMatrix, u_MvpMatrix) {
    // 计算模型视图投影矩阵传递给u_MvpMatrix变量
    g_MvpMatrix.set(viewProjMatrix);
    g_MvpMatrix.rotate(currentAngle, 1.0, 0.0, 1.0);
    g_MvpMatrix.rotate(currentAngle, 0.0, 1.0, 0.0);
    g_MvpMatrix.rotate(currentAngle, 0.0, 0.0, 1.0);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    // 设置颜色和开启深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

var last = Date.now();
function animate(angle) {
    var now = Date.now();
    var elapsed = now - last;

    last = now;

    var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle % 360;
}