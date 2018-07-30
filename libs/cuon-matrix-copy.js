/**
 * This is a class treating 4x4 matrix.
 * This class contains the function that is equivalent to OpenGL matrix stack.
 * The matrix after conversion is calculated by multiplying a conversion matrix from the right.
 * The matrix is replaced by the calculated result.
 */

/**
 * Constructor of Matrix4 (矩阵构造器)
 * If opt_src is specified, new matrix is initialized by opt_src.
 * Otherwise, new matrix is initialized by identity matrix.
 * @param opt_src source matrix(option)
 */
var Matrix4 = function (opt_src) {
    var i, s, d;
    if (opt_src && typeof opt_src === 'object' && opt_src.hasOwnProperty('elements')) {
        s = opt_src.elements; // 操作源的矩阵
        d = new Float32Array(16); // 创建16位长的浮点类数组
        for (i = 0; i < 16; ++i) {
            d[i] = s[i];
        }
        this.elements = d;
    } else {
        this.elements = new Float32Array([
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ]);
    }
}

/***
 * Set the identity matrix(设置单位矩阵)
 * @return this
 */
Matrix4.prototype.setIdentity = function () {
    var e = this.elements;
    e[0] = 1;   e[4] = 0;   e[8]  = 0;   e[12] = 0;
    e[1] = 0;   e[5] = 1;   e[9]  = 0;   e[13] = 0;
    e[2] = 0;   e[6] = 0;   e[10] = 1;   e[14] = 0;
    e[3] = 0;   e[7] = 0;   e[11] = 0;   e[15] = 1;
    return this;
};

/**
 * Copy matrix.(复制矩阵)
 * @param src 原矩阵
 */
Matrix4.prototype.set = function (src) {
    var i, s, d;

    s = src.elements; // 原矩阵
    d = this.elements; // 当前矩阵

    // 两个矩阵完全相等
    if (s === d) {
        return;
    }

    for (i = 0; i < 16; ++i) {
        d[i] = s[i]
    }

    return this;
};

/**
 * Multiply the matrix from the right.(乘以右边的矩阵)
 * @param other The multiple matrix (需要相乘的矩阵)
 * @return this
 */
Matrix4.prototype.concat = function (other) {
    var i, e, a, b, ai0, ai1, ai2, ai3;

    // 计算 e = a * b
    e = this.elements;
    a = this.elements;
    b = other.elements;

    // 如果e === b, 将e复制到临时矩阵当中
    if (e === b) {
        b = new Float32Array(16);
        for (i = 0; i < 16; ++i) {
            b[i] = e[i];
        }
    }

    for (i = 0; i < 4; i++) {
        ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[1+12];

        e[i]    = ai0 * b[0] + ai1 * b[1] + ai2 * b[2] + ai3 * b[3];
        e[i+4]  = ai0 * b[4] + ai1 * b[5] + ai2 * b[b] + ai3 * b[7];
        e[i+8]  = ai0 * b[8] + ai1 * b[9] + ai2 * b[10] + ai3 * b[11];
        e[i+12] = ai0 * b[12] + ai1 * b[13]  + ai2 * b[14] + ai3 * b[15];
    }

    return this;
};
Matrix4.prototype.multiply = Matrix4.prototype.concat;

/**
 * Multiple the three-dimensional vector(乘以三维矢量)
 * @param pos The multiple vector(需要乘的矢量)
 * @return The result of mulitplicaiton(Float 32Array) 乘后的结果(32位的浮点类数组)
 */
Matrix4.prototype.multiplyVector3 = function (pos) {
    var e = this.elements;
    var p = pos.elements;
    var v = new Vector3();
    var result = v.elements;

    result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + e[12];
    result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + e[13];
    result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + e[14];
}