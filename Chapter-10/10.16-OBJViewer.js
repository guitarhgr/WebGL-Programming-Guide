// 顶点着色器
var VSHADER_SOURCE =
`
    // 位置
    // 颜色
    // 法向量
    // 模型视图矩阵
    // 法向量矩阵
    // 传递颜色
    void main () {
        // 光照方向
        // 计算位置
        // 计算法向量
        // 计算法向量和光照的点积
        // 计算颜色
    }
`;

// 片元着色器
var FSHADER_SOURCE =
`
    #ifdef GL_ES
        precision mediump float;
    #endif
    // 传递颜色
    void main () {
        // 赋值颜色
    }
`;

// 页面加载完成时
function main() {
    // 获取canvas元素
    // 获取WebGL渲染上下文
    // 判断渲染上下文是否存在
    // 初始化渲染器
    // 设置清除色和深度缓冲

    // 获取attribute和uniform变量的存储地址

    // 判断是否拿到存储地址

    // 初始化顶点的缓冲数据

    // 创建透视投影矩阵
    // 设置透视投影
    // 设置视点

    // 读取OBJ文件

    // 当前角度
    // 设置循环绘制函数
    var tick = function () {
        // 计算当前角度
        // 绘制
        // 循环调用
    }
    // 开始绘制
    tick();
}

/**
 * @method initVertexBuffers 初始化缓冲数据
 * @param gl
 * @param program
 */
function initVertexBuffers(gl, program) {
    // 创建一个对象存储缓冲数据
    var o = {};
    // 创建空的数据缓冲
    // 位置
    // 法向量
    // 颜色

    // 创建缓冲
    // 顶点索引
    // 判断缓冲是否创建成功

    // 解除缓冲绑定

    // 返回创建的存储对象
    return o;
}

/**
 * @method createEmptyArrayBuffer 创建空缓冲区对象
 * @param gl
 * @param a_attribute
 * @param num
 * @param type
 * @returns {WebGLBuffer}
 */
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
    // 创建缓冲区对象
    var buffer = gl.createBuffer();
    // 判断缓冲区对象是否存在
    // 绑定缓冲区对象
    // 将缓冲区对象关联到attribute变量上
    // 开启attribute

    // 返回缓冲区对象
    return buffer;
}

/**
 * @method readOBJFile 读取OBJ文件
 * @param fileName
 * @param gl
 * @param model
 * @param scale
 * @param reverse
 */
function readOBJFile(fileName, gl, model, scale, reverse) {
    // 创建XMLHttpRequest请求
    var requet = new XMLHttpRequest();
    // 加载完成时
    requet.onreadystatechange = function () {
        if (requet.readyState === 4 && requet.status !== 404) {
            // 完成读取OBJ文件
        }
    }

    requet.open('GET', fileName, true);
    requet.send();
}

// OBJ文件存储对象
// 3D模型存储对象

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
    // 解析文件数据
    // 判断解析结果
    // 创建的OBJDoc对象赋值给OBJ文件存储对象
}

// 模型矩阵
// 模型视图矩阵
// 法向量矩阵

/**
 * @method draw 绘制
 * @param gl
 * @param program
 * @param angle
 * @param viewPorjMatrix
 * @param model
 */
function draw(gl, program, angle, viewPorjMatrix, model) {
    // 判断g_objDoc不为空 && MTLComplete
        // 设置读取完成
    // 判断g_drawingInfo不存在
    // 清除颜色和深度缓冲
    // 设置模型矩阵的x, y, z的旋转

    // 设置模型矩阵的法向量矩阵的逆矩阵
    // 法向量矩阵转置

    // 设置模型视图矩阵的视图矩阵
    // 模型视图矩阵乘模型矩阵
    // 将模型视图矩阵传递给着色器

    // 绘制Element
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

    // 将数据写入缓冲中


    return drawingInfo;
}

// 角度增加增量
// 最近执行时间戳

/**
 * @method animate 计算当前角度
 * @param angle
 */
function animate(angle) {
    // 当前时间
    // 计算上一次到当前的时间间隔
    // 将当前时间赋值给最近执行的时间
    // 计算当前角度
    // 返回当前角度
}

//------------------------------------------------------------------------------
// OBJParser
//------------------------------------------------------------------------------

/**
 * @method 当MTL文件读取完成后操作
 * @param fileString
 * @param mtl
 */
function onReadMTLFile(fileString, mtl) {

}

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

    }

    /**
     * @method parseMTLLib 解析MTLLib
     * @param sp
     * @param fileName
     */
    parseMTLLib (sp, fileName) {

    }

    /**
     * @method parseObjectName 解析对象名
     * @param sp
     */
    parseObjectName (sp) {

    }

    /**
     * @method parseVertex 解析顶点
     * @param sp
     * @param scale
     */
    parseVertex (sp, scale) {

    }

    /**
     * @method 解析法向量
     * @param sp
     */
    parseNormal (sp) {

    }

    /**
     * @method 解析MTL
     * @param sp
     */
    parseUseMTL (sp) {

    }

    /**
     * @method parseFace 解析Face
     * @param sp
     * @param materialName
     * @param vertices
     * @param reverse
     */
    parseFace (sp, materialName, vertices, reverse) {

    }

    /**
     * @method isMTLComplete MTL读取完成
     */
    isMTLComplete () {

    }

    /**
     * @method findColor 查找颜色
     * @param name
     */
    findColor (name) {

    }

    /**
     * @method getDrawingInfo 获取3D模型信息
     */
    getDrawingInfo () {

    }
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
    constructor (str) {
        this.str = str;
        this.index = 0;
    }

    /**
     * @method skipDelimiters
     */
    skipDelimiters () {

    }
}