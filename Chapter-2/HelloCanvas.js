/**第一个webgl小程序*/
function main() {
    // 获取canvas元素
    var canvas = document.getElementById("webgl");
    // 获取webgl渲染上下文
    var gl = getWebGLContext(canvas);
    // 判断是否获取到上下文
    if (!gl) {
        console.log("Failed to get the rendering context for WebGl");
        return;
    }
    // 设置清除颜色
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清空canvas
    gl.clear(gl.COLOR_BUFFER_BIT);
}