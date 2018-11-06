// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position;
    attribute vec4 a_Color;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_ModelMatrix;
    uniform vec4 u_Eye;
    varying vec4 v_Color;
    varying float v_Dist;
    void main () {
        gl_Position = u_MvpMatrix * a_Position;
        v_Color = a_Color;
        v_Dist = distance(u_ModelMatrix * a_Position, u_Eye);
    }
`;

// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    uniform vec3 u_FogColor;
    uniform vec2 u_FogDist;
    varying vec4 v_Color;
    varying float v_Dist;
    void main () {
        float fogFactor = clamp((u_FogDist.y - v_Dist) / (u_FogDist.y - u_FogDist.x), 0.0, 1.0);
        vec3 color = mix(u_FogColor, vec3(v_Color), fogFactor);
        gl_FragColor = vec4(color, v_Color.a);
    }
`;

// 页面加载完成
function main() {
    // 获取canvas元素
    var canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get rendering context for WebGL');
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
        console.log('Failed to set the vertex buffer information');
        return;
    }

    // 设置雾颜色
    var fogColor = new Float32Array([0.137, 0.231, 0.423]);
    // 设置雾距离
    var fogDist = new Float32Array([55, 80]);
    // 设置视点
    var eye = new Float32Array([25, 65, 35, 1.0]);

    // 获取uniform变量的存储地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    var u_Eye = gl.getUniformLocation(gl.program, 'u_Eye');
    var u_FogColor = gl.getUniformLocation(gl.program, 'u_FogColor');
    var u_FogDist = gl.getUniformLocation(gl.program, 'u_FogDist');

    if (!u_MvpMatrix || !u_ModelMatrix || !u_Eye || !u_FogColor || !u_FogDist) {
        console.log('Failed to get the storage location');
        return;
    }

    // 设置雾颜色, 距离, 视点
    gl.uniform3fv(u_FogColor, fogColor);
    gl.uniform2fv(u_FogDist, fogDist);
    gl.uniform4fv(u_Eye, eye);

    // 设置清除颜色和深度缓冲
    gl.clearColor(fogColor[0], fogColor[1], fogColor[2], 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 创建模型矩阵
    var modelMatrix = new Matrix4();
    modelMatrix.setScale(10, 10, 10);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    // 创建模型视图矩阵
    var mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 1000);
    mvpMatrix.lookAt(eye[0], eye[1], eye[2],  0,2,0,  0,1,0);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    document.onkeydown = function (event) {
        keyDown(event, gl, n, u_FogDist, fogDist);
    }

    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);

    var modelViewMatrix = new Matrix4();
    modelViewMatrix.setLookAt(eye[0], eye[1], eye[2],  0,2,0,  0,1,0);
    modelViewMatrix.multiply(modelMatrix);

    modelViewMatrix.multiplyVector4(new Vector4([1,1,1,1]));
    mvpMatrix.multiplyVector4(new Vector4([1,1,1,1]));

    modelViewMatrix.multiplyVector4(new Vector4([-1,1,1,1]));
    mvpMatrix.multiplyVector4(new Vector4([-1,1,1,1]));
}

function keyDown(event, gl, n, u_FogDist, fogDist) {
    switch (event.keyCode) {
        case 38:
            fogDist[1] += 1;
            break;
        case 40:
            if (fogDist[1] > fogDist[0]) fogDist[1] -= 1;
            break;
        default: return;
    }

    gl.uniform2fv(u_FogDist, fogDist);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3

    // 顶点
    var vertices = new Float32Array([   // Vertex coordinates
         1, 1, 1,  -1, 1, 1,  -1,-1, 1,   1,-1, 1,    // v0-v1-v2-v3 front
         1, 1, 1,   1,-1, 1,   1,-1,-1,   1, 1,-1,    // v0-v3-v4-v5 right
         1, 1, 1,   1, 1,-1,  -1, 1,-1,  -1, 1, 1,    // v0-v5-v6-v1 up
        -1, 1, 1,  -1, 1,-1,  -1,-1,-1,  -1,-1, 1,    // v1-v6-v7-v2 left
        -1,-1,-1,   1,-1,-1,   1,-1, 1,  -1,-1, 1,    // v7-v4-v3-v2 down
         1,-1,-1,  -1,-1,-1,  -1, 1,-1,   1, 1,-1     // v4-v7-v6-v5 back
    ]);

    // 颜色
    var colors = new Float32Array([     // Colors
        0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  0.4, 0.4, 1.0,  // v0-v1-v2-v3 front
        0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  0.4, 1.0, 0.4,  // v0-v3-v4-v5 right
        1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  1.0, 0.4, 0.4,  // v0-v5-v6-v1 up
        1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  1.0, 1.0, 0.4,  // v1-v6-v7-v2 left
        1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down
        0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0,  0.4, 1.0, 1.0   // v4-v7-v6-v5 back
    ]);

    // 顶点索引
    var indices = new Uint8Array([       // Indices of the vertices
         0, 1, 2,   0, 2, 3,    // front
         4, 5, 6,   4, 6, 7,    // right
         8, 9,10,   8,10,11,    // up
        12,13,14,  12,14,15,    // left
        16,17,18,  16,18,19,    // down
        20,21,22,  20,22,23     // back
    ]);

    // 创建索引缓冲
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        console.log('Failed to create index buffer object');
        return;
    }

    // 设置顶点缓冲
    if (!initArrayBuffer(gl, vertices, 'a_Position', 3, gl.FLOAT)) return -1;
    // 设置颜色缓冲
    if (!initArrayBuffer(gl, colors, 'a_Color', 3, gl.FLOAT)) return -1;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initArrayBuffer(gl, data, attribute, num, type) {
    // 创建缓冲对象
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create buffer object');
        return false;
    }

    // 绑定缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将数据传入缓冲区
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // 获取attribute属性
    var a_Attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_Attribute < 0) {
        console.log(`Failed to get the storage location of ${attribute}`);
        return false;
    }

    gl.vertexAttribPointer(a_Attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_Attribute);

    return true;
}