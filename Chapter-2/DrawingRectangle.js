/**画一个矩形(canvas)*/
function main() {
    // 获取canvas元素
    var canvas = document.getElementById("example");
    // 判断是否浏览器是否支持canvas
    if (!canvas) {
        console.log("sorry, your browser don't support canvas.");
        return;
    }
    // 获取渲染上下文
    var ctx = canvas.getContext("2d");
    // 设置填充颜色
    ctx.fillStyle = "rgba(0, 0, 255, 1)";
    // 画一个长方形
    ctx.fillRect(50, 50, 100, 100);
}
/**反思
 * 绘制二维和三维的图形步骤：
 * 1. 获取<canvas>元素
 * 2. 向该元素请求二维/三维图形的“绘图上下文”
 * 3. 在绘图上下文上调用相应的绘图函数，以绘制二维图形
 * */