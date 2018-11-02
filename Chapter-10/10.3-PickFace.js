// 顶点着色器
var VSHADER_SOURCE =
`
    attribute vec4 a_Position; // 位置
    attribute vec4 a_Color; // 颜色
    attribute float a_Face; // 表面编号
    uniform mat4 u_MvpMatrix; // 模型视图矩阵
    uniform int u_PickedFace; // 被选中面编号
    varying vec4 v_Color; // 传递颜色
    void main () {
        gl_Position = u_MvpMatrix * a_Color;
        int face = int(a_Face);
        vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;
    }
`;