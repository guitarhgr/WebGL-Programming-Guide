// 顶点着色器
const VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Color; // 颜色
    attribute vec4 a_Normal; // 法向量
    uniform mat4 u_MvpMatrix; // 模型视图矩阵
    uniform mat4 u_NormalMatrix; // 法向量矩阵
    varying vec4 v_Color; // 传递颜色
    void main () {
        vec3 lightDirection = vec3(-0.35, 0.35, 0.87); // 光照方向
        gl_Position = u_MvpMatrix * a_Position; // 计算位置
        vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal)); // 计算法向量
        float nDotL = max(dot(normal, lightDirection), 0.0); // 计算法向量和光照的点积
        v_Color = vec4(a_Color.rgb * nDotL, a_Color.a); // 计算颜色
    }
`;

// 片元着色器
const FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    varying vec4 v_Color; // 传递颜色
    void main () {
        gl_FragColor = v_Color; // 赋值颜色
    }
`;

// 页面加载完成时
function main() {
    // 获取canvas元素
    const canvas = document.querySelector('#webgl');
    // 获取WebGL渲染上下文
    const gl = getWebGLContext(canvas);
    // 判断渲染上下文是否存在
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // 初始化渲染器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize the shaders');
        return;
    }
    // 设置清除色和深度缓冲
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // 获取attribute和uniform变量的存储地址
    const program = gl.program;
    program.a_Position = gl.getAttribLocation(program, 'a_Position');
    program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
    program.a_Color = gl.getAttribLocation(program, 'a_Color');
    program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
    program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');

    // 判断是否拿到存储地址
    if (program.a_Position < 0 || program.a_Normal < 0 || program.a_Color < 0 ||
        !program.u_MvpMatrix || !program.u_NormalMatrix) {
        console.log('Failed to get the storage location of attribute or uniform.');
        return;
    }

    // 初始化顶点的缓冲数据
    const model = initVertexBuffers(gl, program);
    if (!model) {
        console.log('Failed to set the vertex information.');
        return;
    }

    // 创建透视投影矩阵
    const viewProjMatrix = new Matrix4();
    // 设置透视投影
    viewProjMatrix.setPerspective(30.0, canvas.width/canvas.height, 1.0, 5000.0);
    // 设置视点
    viewProjMatrix.lookAt(0.0,500.0,200.0,  0.0,0.0,0.0,  0.0,1.0,0.0);

    // 读取OBJ文件
    readOBJFile('cube.obj', gl, model, 60, true);
    // 当前角度
    let currentAngle = 0.0;
    // 设置循环绘制函数
    const tick = function () {
        // 计算当前角度
        currentAngle = animate(currentAngle);
        // 绘制
        draw(gl, gl.program, currentAngle, viewProjMatrix, model);
        // 循环调用
        requestAnimationFrame(tick);
    };
    // 开始绘制
    tick();
}

/**
 * @method initVertexBuffers 初始化缓冲数据
 * @param {object} gl WebGl渲染上下文
 * @param {object} program 渲染程序
 * @returns {*}
 */
function initVertexBuffers(gl, program) {
    // 创建一个对象存储缓冲数据
    const o = {};
    // 创建空的数据缓冲
    o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT); // 位置
    o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT); // 法向量
    o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT); // 颜色
    o.indexBuffer = gl.createBuffer(); // 顶点索引

    // 判断缓冲是否创建成功
    if (!o.vertexBuffer || !o.normalBuffer ||
        !o.colorBuffer || !o.indexBuffer) {
        console.log('Failed to create buffer objects.');
        return null;
    }

    // 解除缓冲绑定
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // 返回创建的存储对象
    return o;
}

/**
 * @method createEmptyArrayBuffer 创建空缓冲区对象
 * @param {object} gl WebGl渲染上下文
 * @param {number} a_attribute 着色器变量存储地址
 * @param {number} num 数量
 * @param {number} type 渲染类型
 * @returns {*}
 */
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    // 创建缓冲区对象
    const buffer = gl.createBuffer();
    // 判断缓冲区对象是否存在
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return null;
    }
    // 绑定缓冲区对象
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // 将缓冲区对象关联到attribute变量上
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // 开启attribute
    gl.enableVertexAttribArray(a_attribute);

    // 返回缓冲区对象
    return buffer;
}

/**
 * @method readOBJFile 读取OBJ文件
 * @param {string} fileName 模型名称
 * @param {object} gl
 * @param {object} model
 * @param scale
 * @param reverse
 */
function readOBJFile(fileName, gl, model, scale, reverse) {
    // 创建XMLHttpRequest请求
    const request = new XMLHttpRequest();
    // 加载完成时
    request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status !== 404) {
            // 完成读取OBJ文件
            onReadOBJFile(request.responseText, fileName, gl, model, scale, reverse);
        }
    };

    request.open('GET', fileName, true);
    request.send();
}

// OBJ文件存储对象
let g_objDoc = null;
// 3D模型存储对象
let g_drawingInfo = null;

/**
 * @method onReadOBJFile 完成对象文件对象
 * @param fileString
 * @param fileName
 * @param gl
 * @param o
 * @param scale
 * @param reverse
 */
function onReadOBJFile(fileString, fileName, gl, o, scale, reverse) {
    // 创建OBJDoc对象
    const objDoc = new OBJDoc(fileName);
    // 解析文件数据
    const result = objDoc.parse(fileString, scale, reverse);
    // 判断解析结果
    if (!result) {
        g_objDoc = null;
        g_drawingInfo = null;
        console.log('OBJ file parsing error');
        return;
    }
    // 创建的OBJDoc对象赋值给OBJ文件存储对象
    g_objDoc = objDoc;
}

// 模型矩阵
const g_modelMatrix = new Matrix4();
// 模型视图矩阵
const g_mvpMatrix = new Matrix4();
// 法向量矩阵
const g_normalMatrix = new Matrix4();

/**
 * @method draw 绘制
 * @param gl
 * @param program
 * @param angle
 * @param viewProjMatrix
 * @param model
 */
function draw(gl, program, angle, viewProjMatrix, model) {
    // 判断g_objDoc不为空 && MTLComplete
    if (g_objDoc !== null && g_objDoc.isMTLComplete()) {
        // 设置读取完成
        g_drawingInfo = onReadComplete(gl, model, g_objDoc);
        g_objDoc = null;
    }
    // 判断g_drawingInfo不存在
    if (!g_drawingInfo) return;
    // 清除颜色和深度缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 设置模型矩阵的x, y, z的旋转
    g_modelMatrix.setRotate(angle, 1.0, 0.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 1.0, 0.0);
    g_modelMatrix.rotate(angle, 0.0, 0.0, 1.0);


    // 设置模型矩阵的法向量矩阵的逆矩阵
    g_normalMatrix.setInverseOf(g_modelMatrix);
    // 法向量矩阵转置
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

    // 设置模型视图矩阵的视图矩阵
    g_mvpMatrix.set(viewProjMatrix);
    // 模型视图矩阵乘模型矩阵
    g_mvpMatrix.multiply(g_modelMatrix);
    // 将模型视图矩阵传递给着色器
    gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

    // 绘制Element
    gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

/**
 * @method onReadComplete OBJ读取完成
 * @param gl
 * @param model
 * @param objDoc
 * @returns {*}
 */
function onReadComplete(gl, model, objDoc) {
    // 获取绘制的数据
    const drawingInfo = objDoc.getDrawingInfo();

    // 将数据绑定并写入缓冲中
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

    return drawingInfo;
}

// 角度增加增量
const ANGLE_STEP = 30.0;
// 最近执行时间戳
let last = Date.now();

/**
 * @method animate 计算当前角度
 * @param angle
 */
function animate(angle) {
    // 当前时间
    const now = Date.now();
    // 计算上一次到当前的时间间隔
    const elapsed = now - last;
    // 将当前时间赋值给最近执行的时间
    last = now;
    // 计算当前角度
    const newAngle = angle + (ANGLE_STEP * elapsed) / 1000;
    // 返回当前角度
    return newAngle % 360;
}

//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------

// OBJDoc 对象构造器
/**
 * @classs OBJ文档对象
 */
class OBJDoc {
    /**
     * @constructor 构造器
     * @param fileName
     */
    constructor (fileName) {
        this.fileName = fileName;
        this.mtls = [];
        this.objects = [];
        this.vertices = [];
        this.normals = [];
    }

    /**
     * @method parse 解析
     * @param fileString
     * @param scale
     * @param reverse
     */
    parse (fileString, scale, reverse) {
        const lines = fileString.split('\n');
        lines.push(null);

        let index = 0;
        let currentObject = null;
        let currentMaterialName = '';
        let line;
        let sp = new StringParser();

        while ((line = lines[index++]) !== null) {
            sp.init(line);
            const command = sp.getWord();
            if (command === null) continue;

            switch (command) {
                case '#':
                    continue;
                case 'mtllib':
                    const path = this.parseMTLLib(sp, this.fileName);
                    const mtl = new MTLDoc();
                    this.mtls.push(mtl);
                    const request = new XMLHttpRequest();

                    request.onreadystatechange = function () {
                        if (request.readyState === 4) {
                            if (request.status !== 404) {
                                onReadMTLFile(request.responseText, mtl);
                            } else {
                                mtl.complete = true;
                            }
                        }
                    };

                    request.open('GET', path, true);
                    request.send();
                    continue;
                case 'o':
                case 'g':
                    const object = this.parseObjectName(sp);
                    this.objects.push(object);
                    currentObject = object;
                    continue;
                case 'v':
                    const vertex = this.parseVertex(sp, scale);
                    this.vertices.push(vertex);
                    continue;
                case 'vn':
                    const normal = this.parseNormal(sp);
                    this.normals.push(normal);
                    continue;
                case 'usemtl':
                    currentMaterialName = this.parseUseMTL(sp);
                    continue;
                case 'f':
                    const face = this.parseFace(sp, currentMaterialName, this.vertices, reverse);
                    currentObject.addFace(face);
            }
        }

        return true;
    }

    /**
     * @method parseMTLLib 解析MTLLib
     * @param sp
     * @param fileName
     */
    parseMTLLib (sp, fileName) {
        let i = fileName.lastIndexOf('/');
        let dirPath = '';
        if (i > 0) {
            dirPath = fileName.substr(0, i+1);
        }

        return dirPath + sp.getWord();
    }

    /**
     * @method parseObjectName 解析对象名
     * @param sp
     */
    parseObjectName (sp) {
        const name = sp.getWord();
        return (new OBJObject(name));
    }

    /**
     * @method parseVertex 解析顶点
     * @param sp
     * @param scale
     */
    parseVertex (sp, scale) {
        const x = sp.getFloat() * scale;
        const y = sp.getFloat() * scale;
        const z = sp.getFloat() * scale;

        return (new Vertex(x, y, z));
    }

    /**
     * @method 解析法向量
     * @param sp
     */
    parseNormal (sp) {
        const x = sp.getFloat();
        const y = sp.getFloat();
        const z = sp.getFloat();

        return (new Normal(x, y, z));
    }

    /**
     * @method 解析MTL
     * @param sp
     */
    parseUseMTL (sp) {
        return sp.getWord();
    }

    /**
     * @method parseFace 解析Face
     * @param sp
     * @param materialName
     * @param vertices
     * @param reverse
     */
    parseFace (sp, materialName, vertices, reverse) {
        const face = new Face(materialName);

        // 获取顶点
        for (;;) {
            const word = sp.getWord();
            if (word == null) break;

            const subWords = word.split('/');
            if (subWords.length >= 1) {
                const vi = parseInt(subWords[0]) - 1;
                face.vIndices.push(vi);
            }

            if (subWords.length >= 3) {
                const ni = parseInt(subWords[2]) - 1;
                face.nIndices.push(ni);
            } else {
                face.nIndices.push(-1);
            }
        }

        // 计算法向量
        const v0 = [
            vertices[face.vIndices[0]].x,
            vertices[face.vIndices[0]].y,
            vertices[face.vIndices[0]].z
        ];
        const v1 = [
            vertices[face.vIndices[1]].x,
            vertices[face.vIndices[1]].y,
            vertices[face.vIndices[1]].z
        ];
        const v2 = [
            vertices[face.vIndices[2]].x,
            vertices[face.vIndices[2]].y,
            vertices[face.vIndices[2]].z
        ];

        let normal = calcNormal(v0, v1, v2);
        if (normal == null) {
            if (face.vIndices.length >= 4) {
                const v3 = [
                    vertices[face.vIndices[3]].x,
                    vertices[face.vIndices[3]].y,
                    vertices[face.vIndices[3]].z
                ];
                normal = calcNormal(v1, v2, v3);
            }

            if (normal == null) {
                normal = [0.0, 1.0, 0.0];
            }
        }

        if (reverse) {
            normal[0] = -normal[0];
            normal[1] = -normal[1];
            normal[2] = -normal[2];
        }
        face.normal = new Normal(normal[0], normal[1], normal[2]);

        if (face.vIndices.length > 3) {
            const n = face.vIndices.length - 2;
            const newVIndices = new Array(n * 3);
            const newNIndices = new Array(n * 3);

            for (let i = 0; i < n; i++) {
                newVIndices[i * 3 + 0] = face.vIndices[0];
                newVIndices[i * 3 + 1] = face.vIndices[i + 1];
                newVIndices[i * 3 + 2] = face.vIndices[i + 2];

                newNIndices[i * 3 + 0] = face.nIndices[0];
                newNIndices[i * 3 + 1] = face.nIndices[i + 1];
                newNIndices[i * 3 + 2] = face.nIndices[i + 2];
            }

            face.vIndices = newVIndices;
            face.nIndices = newNIndices;
        }
        face.numIndices = face.vIndices.length;

        return face;
    }

    /**
     * @method isMTLComplete MTL读取完成
     */
    isMTLComplete () {
        if (this.mtls.length === 0) return true;

        for (let i = 0; i < this.mtls.length; i++) {
            if (!this.mtls[i].complete) return false;
        }

        return true;
    }

    /**
     * @method findColor 查找颜色
     * @param name
     */
    findColor (name) {
        for (let i = 0; i < this.mtls.length; i++) {
            for (let j = 0; j < this.mtls[i].materials.length; j++) {
                if (this.mtls[i].materials[j].name === name) {
                    return (this.mtls[i].materials[j].color);
                }
            }
        }

        return (new Color(0.8, 0.8, 0.8, 1));
    }

    /**
     * @method getDrawingInfo 获取3D模型信息
     */
    getDrawingInfo () {
        let numIndices = 0;

        for (let i = 0; i < this.objects.length; i++) {
            numIndices += this.objects[i].numIndices;
        }

        const numVertices = numIndices;
        const vertices = new Float32Array(numVertices * 3);
        const normals = new Float32Array(numVertices * 3);
        const colors = new Float32Array(numVertices * 4);
        const indices = new Uint16Array(numIndices);

        let index_indices = 0;
        for (let i = 0; i < this.objects.length; i++) {
            const object = this.objects[i];
            for (let j = 0; j < object.faces.length; j++) {
                const face = object.faces[j];
                const color = this.findColor(face.materialName);
                const faceNormal = face.normal;
                for (let k = 0; k < face.vIndices.length; k++) {
                    indices[index_indices] = index_indices;

                    const vIdx = face.vIndices[k];
                    const vertex = this.vertices[vIdx];
                    // 复制顶点
                    vertices[index_indices * 3 + 0] = vertex.x;
                    vertices[index_indices * 3 + 1] = vertex.y;
                    vertices[index_indices * 3 + 2] = vertex.z;

                    // 复制颜色
                    colors[index_indices * 4 + 0] = color.r;
                    colors[index_indices * 4 + 1] = color.g;
                    colors[index_indices * 4 + 2] = color.b;
                    colors[index_indices * 4 + 3] = color.a;

                    // 复制法向量
                    const nIdx = face.nIndices[k];
                    if (nIdx >= 0) {
                        const normal = this.normals[nIdx];
                        normals[index_indices * 3 + 0] = normal.x;
                        normals[index_indices * 3 + 1] = normal.y;
                        normals[index_indices * 3 + 2] = normal.z;
                    } else {
                        normals[index_indices * 3 + 0] = faceNormal.x;
                        normals[index_indices * 3 + 1] = faceNormal.y;
                        normals[index_indices * 3 + 2] = faceNormal.z;
                    }
                    index_indices++;
                }
            }
        }
        return new DrawingInfo(vertices, normals, colors, indices);
    }
}

/**
 * @method 当MTL文件读取完成后操作
 * @param fileString
 * @param mtl
 */
function onReadMTLFile(fileString, mtl) {
    const lines = fileString.split('\n');
    const sp = new StringParser();
    let index = 0;
    let line;
    let name = '';

    lines.push(null);

    while ((line = lines[index++]) != null) {
        sp.init(line);
        const commond = sp.getWord();
        if (commond === null) continue;

        switch (commond) {
            case '#':
                continue;
            case 'newmtl':
                name = mtl.parseNewMTL(sp);
                continue;
            case 'Kd':
                if (name === '') continue;
                const material = mtl.parseRGB(sp, name);
                mtl.materials.push(material);
                name = '';
        }
    }
    mtl.complete = true;
}

/**
 * @class MTLDoc
 */
class MTLDoc {
    /**
     * @constructor
     */
    constructor () {
        this.complete = false;
        this.materials = [];
    }

    /**
     * @method parseNewMTL 解析MTL
     * @param sp
     * @returns {*}
     */
    parseNewMTL (sp) {
        return sp.getWord();
    }

    /**
     * @method parseRGB 解析
     * @param sp
     * @param name
     */
    parseRGB (sp, name) {
        const r = sp.getFloat();
        const g = sp.getFloat();
        const b = sp.getFloat();

        return (new Matrix4(name, r, g, b, 1));
    }
}

/**
 * @class Material 材料
 */
class Material {
    /**
     * @constructor
     * @param name
     * @param r
     * @param g
     * @param b
     * @param a
     */
    constructor (name, r, g, b, a) {
        this.name = name;
        this.color = new Color(r, g, b, a);
    }
}

/**
 * @class 顶点
 */
class Vertex {
    /**
     * constructor
     * @param x
     * @param y
     * @param z
     */
    constructor (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/**
 * @class 法向量
 */
class Normal {
    /**
     *
     * @param x
     * @param y
     * @param z
     */
    constructor (x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

/**
 * @class 颜色
 */
class Color {
    /**
     * constructor
     * @param r
     * @param g
     * @param b
     * @param a
     */
    constructor (r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
}

/**
 * @class OBJObject
 */
class OBJObject {
    /**
     * constructor
     * @param name
     */
    constructor (name) {
        this.name = name;
        this.faces = [];
        this.numIndices = 0;
    }

    /**
     * @method addFace 添加面
     * @param face
     */
    addFace (face) {
        this.faces.push(face);
        this.numIndices += face.numIndices;
    }
}

/**
 * @class Face 面
 */
class Face {
    /**
     * constructor
     * @param materialName
     */
    constructor (materialName) {
        this.materialName = materialName || "";
        this.vIndices = [];
        this.nIndices = [];
    }
}

/**
 * @class DrawingInfo
 */
class DrawingInfo {
    /**
     * constructor
     * @param vertices
     * @param normals
     * @param colors
     * @param indices
     */
    constructor (vertices, normals, colors, indices) {
        this.vertices = vertices;
        this.normals = normals;
        this.colors = colors;
        this.indices = indices;
    }
}

class StringParser {
    constructor () {
        this.str;
        this.index;
    }

    init (str) {
        this.str = str;
        this.index = 0;
    }

    /**
     * @method skipDelimiters
     */
    skipDelimiters () {
        let i, len;
        for (i = this.index, len  = this.str.length; i < len; i++) {
            const c = this.str.charAt(i);
            // 跳过 TAB, Space, '(', ')'
            if (c === '\t' || c === ' ' || c === '(' || c === ')' || c === '"') {
                continue;
            }
            break;
        }
        this.index = i;
    }

    /**
     * @method 跳到下一节点
     */
    skipToNextWord () {
        this.skipDelimiters();
        const n = getWordLength(this.str, this.index);
        this.index += (n + 1);
    };

    /**
     * @method getWord 获取字符
     */
    getWord () {
        this.skipDelimiters();
        const n = getWordLength(this.str, this.index);
        if (n == 0) return null;

        const word = this.str.substr(this.index, n);
        this.index += (n + 1);

        return word;
    }

    /**
     * @method getInt 获取整型
     */
    getInt () {
        return parseInt(this.getWord());
    }

    /**
     * @method getFloat 获取浮点型
     */
    getFloat () {
        return parseFloat(this.getWord());
    }
}

/**
 * @method getWordLength 获取字符长度
 * @param {string} str
 * @param {number} start
 */
function getWordLength(str, start) {
    let i, len;
    for (i = start, len = str.length; i < len; i++) {
        const c = str.charAt(i);
        if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"') {
            break;
        }
    }

    return i - start;
}

/**
 * @method calcNormal 计算法向量
 * @param po
 * @param p1
 * @param p2
 */
function calcNormal(p0, p1, p2) {
    const v0 = new Float32Array(3);
    const v1 = new Float32Array(3);

    for (let i = 0; i < 3; i++) {
        v0[i] = p0[i] - p1[i];
        v1[i] = p2[i] - p1[i];
    }

    const c = new Float32Array(3);
    c[0] = v0[1] * v1[2] - v0[2] * v1[1];
    c[1] = v0[2] * v1[0] - v0[0] * v1[2];
    c[2] = v0[0] * v1[1] - v0[1] * v1[0];

    const v = new Vector3(c);
    v.normalize();

    return v.elements;
}