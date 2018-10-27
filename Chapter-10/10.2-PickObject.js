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
            v_Color = vec4()
        }
    }
`;
// 片元着色器
var FSHADER_SOURCE =
`
    
`;

// 页面加载完成后执行
function main() {
    // 获取canvas元素
    // 获取WebGL渲染上下文
    // 初始化着色器
    // 设置顶点缓冲
    // 设置清除颜色和开始深度测试
    // 获取attribute和uniform变量的存储地址
    // 创建视图投影矩阵
    // 设置点击
    // 绑定事件处理函数
    // 创建循环函数
}