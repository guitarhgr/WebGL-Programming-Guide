// 顶点着色器
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '   gl_Position = a_Position;\n' +
    '   v_TexCoord = a_TexCoord;\n' +
    '}\n';
// 片元着色器
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_Sampler;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    '   gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
    '}\n';

function main() {
    // 获取canvas元素
    var canvas = document.getElementById('webgl');
    // 获取渲染上下文
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
    // 设置顶点信息
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }
    // 设置canvas清除色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 设置纹理
    if (!initTextures(gl, n)) {
        console.log('Failed to initialize the textures');
        return;
    }
}

// 设置纹理坐标数据
function initVertexBuffers(gl) {
    // 创建顶点数据的浮点类型数组
    var verticesTexCoords = new Float32Array([
        -0.5,  0.5,    0.0, 1.0,
        -0.5, -0.5,    0.0, 0.0,
         0.5,  0.5,    1.0, 1.0,
         0.5, -0.5,    1.0, 0.0
    ]);
    var n = 4; // 顶点数量

    // 创建缓冲区对象
    var vertexTexCoordBuffer = gl.createBuffer();
    if (!vertexTexCoordBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // 将buffer绑定到缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

    var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
    // 获取顶点着色器中的顶点位置变量，并分配缓冲区，开启
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE*4, 0);
    gl.enableVertexAttribArray(a_Position);
    // 获取顶点着色器中的纹理变量，并分配缓冲区，开启
    var a_TexCoord = gl.getAttribLocation(gl.program, 'a_TexCoord');
    if (a_TexCoord < 0) {
        console.log('Failed to get the storage location of a_TexCoord');
        return;
    }
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE*4, FSIZE*2);
    gl.enableVertexAttribArray(a_TexCoord);

    return n;
}

// 配置和加载纹理
function initTextures(gl, n) {
    // 创建纹理对象
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }
    // 获取u_Sampler在内存中的位置
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    if (!u_Sampler) {
        console.log('Failed to get the storage location of u_Sampler');
        return false;
    }
    // 创建图片对象
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // 注册图片加载完成事件
    image.onload = function () {
        loadTexture(gl, n, texture, u_Sampler, image);
    };

    // 设置图片路径
    image.src = '../resources/flower.png';
    return true;
}

// 为WebGL配置纹理
function loadTexture(gl, n, texture, u_Sampler, image) {
    // 对纹理图像进行y轴旋转
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    // 开启0号纹理单元
    gl.activeTexture(gl.TEXTURE0);
    // 向target绑定纹理对象
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 配置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // 配置纹理图像
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    // 将0号纹理传递给着色器
    gl.uniform1i(u_Sampler, 0);

    // 清除canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 绘制图形
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
}
/**划重点
 * 1.纹理映射: 将一张图片(就像一张贴纸)映射(贴)到一个几何图形的表面上
 * 2.纹理图像/纹理: 将一张真实世界的图片贴到一个由两个三角形组成的矩形上，这样矩形表面看上去就是这张图片。
 *  此时这张图片又可以称为纹理图像或纹理。
 * 3.纹理映射的作用：就是根据纹理图像，为之前光栅化后的每个片源涂上合适的颜色。
 * 4.纹素：组成纹理图像的像素，每个纹素的颜色都使用RGB或RGBA格式编码
 * 5.纹理映射的步骤：
 *      a. 准备好映射到几何图形上的纹理图像
 *      b. 为几何图形配置纹理映射方式
 *      c. 加载纹理图像，为其进行一些配置，以在WebGL中使用它
 *      d. 在片元着色器中将相应的纹素从纹理中抽取出来，并将纹素的颜色赋给片元
 * 6.纹理坐标：纹理坐标是纹理图像上的坐标，通过纹理坐标可以在纹理图像上获取纹素颜色。WebGL系统中的纹理坐标是
 *  二维的。WebGL使用s和t命名纹理坐标(st坐标系统/uv坐标系统)
 * 7.纹理对象用来管理WebGL系统中的纹理
 * 8.取样器(Sampler): 因为从纹理图像中获取纹素颜色的过程，相当于从纹理图像中"取样",既输入
 *  纹理坐标，返回颜色值。实际上，由于纹理像素也是有大小的，取样处的纹理坐标很可能并不落在
 *  某个像素中心，所有取样通常并不是直接取纹理图像某个像素的颜色，而是通过附近的若干个像素
 *  共同计算而得。
 * 9.图像Y轴反转: WebGl纹理坐标系统中的t轴的方向和PNG、BMP、JPG等格式的图片的坐标系统的Y轴方向是相反的。
 *  因此，只有先将图像Y轴进行反转，才能够正确地将图像映射到图形上。(或者，也可以在着色器中手动反转t轴坐标)
 * 10.纹理单元: WebGL通过一种称作纹理单元的机制来同时使用多个纹理。每个纹理单元有一个单元编号来管理一张纹理
 *  图像。即使你的程序只需要一张纹理图像，也得为其指定一个纹理单元。
 * 11.系统支持的纹理单元个数取决于硬件和浏览器的WebGL实现，但是在默认情况下，WebGL至少支持8个纹理单元，一
 *  些其他的系统支持的个数更多。内置的变量gl.TEXTURE0、gl.TEXTURE1.....GL.TEXTURE7各表示一个纹理单元。
 * 12.流明: 表示感知到的物体的表面的亮度。通常使用物体表面红、绿、蓝颜色分量的加权平均来计算流明
 * */