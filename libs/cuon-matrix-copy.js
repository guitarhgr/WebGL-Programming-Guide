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
 * Multiple the three-dimensional vector(乘以三维向量)
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

    return v;
};



/**
 * Multiply the fore-dimensional vector.(矩阵乘以四维向量)
 * @param pos The multiple vector
 * @return The result of multiplication(Float32Array)
 */
Matrix4.prototype.multiplyVector4 = function (pos) {
    var e = this.elements;
    var p = pos.elements;
    var v = new Vector4();
    var result = v.elements;

    result[0] = p[0] * e[0] + p[1] * e[4] + p[2] * e[ 8] + p[3] * e[12];
    result[1] = p[0] * e[1] + p[1] * e[5] + p[2] * e[ 9] + p[3] * e[13];
    result[2] = p[0] * e[2] + p[1] * e[6] + p[2] * e[10] + p[3] * e[14];
    result[3] = p[0] * e[3] + p[1] * e[7] + p[2] * e[11] + p[3] * e[15];

    return v;
};

/**
 * Transpose the Matrix.(转置矩阵)
 * @returns {Matrix4}
 */
Matrix4.prototype.transpose = function () {
    var e, t;

    e = this.elements;

    t = e[ 1]; e[ 1] = e[ 4]; e[ 4] = t;
    t = e[ 2]; e[ 2] = e[ 8]; e[ 8] = t;
    t = e[ 3]; e[ 3] = e[12]; e[12] = t;
    t = e[ 6]; e[ 6] = e[ 9]; e[ 9] = t;
    t = e[ 7]; e[ 7] = e[13]; e[13] = t;
    t = e[11]; e[11] = e[14]; e[11] = t;

    return this;
};

/**
 * Calculate the inverse matrix of specified matrix, and set to this.(计算矩阵的逆矩阵，并设置到this)
 * @param other The source matrix
 * @returns {Matrix4} this
 */
Matrix4.prototype.setInverseOf = function (other) {
    var i, s, d, inv, det;

    s = other.elements;
    d = this.elements;
    inv = new Float32Array(16);

    inv[0]  =   s[5]*s[10]*s[15] - s[5] *s[11]*s[14] - s[9] *s[6]*s[15]
              + s[9]*s[7] *s[14] + s[13]*s[6] *s[11] - s[13]*s[7]*s[10];
    inv[4]  = - s[4]*s[10]*s[15] + s[4] *s[11]*s[14] + s[8] *s[6]*s[15]
              - s[8]*s[7] *s[14] - s[12]*s[6] *s[11] + s[12]*s[7]*s[10];
    inv[8]  =   s[4]*s[9] *s[15] - s[4] *s[11]*s[13] - s[8] *s[5]*s[15]
              + s[8]*s[7] *s[13] + s[12]*s[5] *s[11] - s[12]*s[7]*s[9];
    inv[12] = - s[4]*s[9] *s[14] + s[4] *s[10]*s[13] + s[8] *s[5]*s[14]
              - s[8]*s[6] *s[13] - s[12]*s[5] *s[10] + s[12]*s[6]*s[9];

    inv[1]  = - s[1]*s[10]*s[15] + s[1] *s[11]*s[14] + s[9] *s[2]*s[15]
              - s[9]*s[3] *s[14] - s[13]*s[2] *s[11] + s[13]*s[3]*s[10];
    inv[5]  =   s[0]*s[10]*s[15] - s[0] *s[11]*s[14] - s[8] *s[2]*s[15]
              + s[8]*s[3] *s[14] + s[12]*s[2] *s[11] - s[12]*s[3]*s[10];
    inv[9]  = - s[0]*s[9] *s[15] + s[0] *s[11]*s[13] + s[8] *s[1]*s[15]
              - s[8]*s[3] *s[13] - s[12]*s[1] *s[11] + s[12]*s[3]*s[9];
    inv[13] =   s[0]*s[9] *s[14] - s[0] *s[10]*s[13] - s[8] *s[1]*s[14]
              + s[8]*s[2] *s[13] + s[12]*s[1] *s[10] - s[12]*s[2]*s[9];

    inv[2]  =   s[1]*s[6]*s[15] - s[1] *s[7]*s[14] - s[5] *s[2]*s[15]
              + s[5]*s[3]*s[14] + s[13]*s[2]*s[7]  - s[13]*s[3]*s[6];
    inv[6]  = - s[0]*s[6]*s[15] + s[0] *s[7]*s[14] + s[4] *s[2]*s[15]
              - s[4]*s[3]*s[14] - s[12]*s[2]*s[7]  + s[12]*s[3]*s[6];
    inv[10] =   s[0]*s[5]*s[15] - s[0] *s[7]*s[13] - s[4] *s[1]*s[15]
              + s[4]*s[3]*s[13] + s[12]*s[1]*s[7]  - s[12]*s[3]*s[5];
    inv[14] = - s[0]*s[5]*s[14] + s[0] *s[6]*s[13] + s[4] *s[1]*s[14]
              - s[4]*s[2]*s[13] - s[12]*s[1]*s[6]  + s[12]*s[2]*s[5];

    inv[3]  = - s[1]*s[6]*s[11] + s[1]*s[7]*s[10] + s[5]*s[2]*s[11]
              - s[5]*s[3]*s[10] - s[9]*s[2]*s[7]  + s[9]*s[3]*s[6];
    inv[7]  =   s[0]*s[6]*s[11] - s[0]*s[7]*s[10] - s[4]*s[2]*s[11]
              + s[4]*s[3]*s[10] + s[8]*s[2]*s[7]  - s[8]*s[3]*s[6];
    inv[11] = - s[0]*s[5]*s[11] + s[0]*s[7]*s[9]  + s[4]*s[1]*s[11]
              - s[4]*s[3]*s[9]  - s[8]*s[1]*s[7]  + s[8]*s[3]*s[5];
    inv[15] =   s[0]*s[5]*s[10] - s[0]*s[6]*s[9]  - s[4]*s[1]*s[10]
              + s[4]*s[2]*s[9]  + s[8]*s[1]*s[6]  - s[8]*s[2]*s[5];

    det = s[0]*inv[0] + s[1]*inv[4] + s[2]*inv[8] + s[3]*inv[12];
    if (det === 0) {
        return this;
    }

    det = 1 / det;
    for (i = 0; i < 16; i++) {
        d[i] = inv[i] * det;
    }

    return this;
};

/**
 * Calculate the inverse matrix of this, and set to this.
 * @returns {Matrix4|this}
 */
Matrix4.prototype.invert = function () {
    return this.setInverseOf(this);
};

/**
 * Set the orthographic projection matrix.(设置正交投影的矩阵)
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top clipping plane
 * @param near The distance to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer
 * @param far The distances to the farther depth clipping plane. This value is minus if plane is to be behind the viewer.
 * @returns {Matrix4}
 */
Matrix4.prototype.setOrtho = function (left, right, bottom, top, near, far) {
    var e, rw, rh, rd;

    if (left === right || bottom === top || near === far) {
        throw 'null frustum';
    }

    rw = 1 / (right - left);
    rh = 1 / (top - bottom);
    rd = 1 / (far - near);

    e = this.elements;

    e[ 0] = 2 * rw;
    e[ 1] = 0;
    e[ 2] = 0;
    e[ 3] = 0;

    e[ 4] = 0;
    e[ 5] = 2 * rh;
    e[ 6] = 0;
    e[ 7] = 0;

    e[ 8] = 0;
    e[ 9] = 0;
    e[10] = -2 * rd;
    e[11] = 0;

    e[12] = -(right + left) * rw;
    e[13] = -(top + bottom) * rh;
    e[14] = -(far + near) * rd;
    e[15] = 1;

    return this;
};

/**
 * Multiply the orthographic projection matrix from the right.(右乘正交投影矩阵)
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top clipping plane
 * @param near The distance to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer
 * @param far The distances to the farther depth clipping plane. This value is minus if plane is to be behind the viewer.
 * @returns {this}
 */
Matrix4.prototype.ortho = function (left, right, bottom, top, near, far) {
    return this.concat(new Matrix4().setOrtho(left, right, bottom, top, near, far));
};


/**
 * Set th perspective projection matrix. (设置透视投影矩阵)
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top clipping plane
 * @param near The distance to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer
 * @param far The distances to the farther depth clipping plane. This value is minus if plane is to be behind the viewer.
 * @returns {Matrix4}
 */
Matrix4.prototype.setFrustum = function (left, right, bottom, top, near, far) {
    var e, rw, rh, rd;

    if (left === right || top === bottom || near === far) {
        throw 'null frustum';
    }
    if (near <= 0) {
        throw 'near <= 0';
    }
    if (far <= 0) {
        throw 'far <= 0';
    }

    rw = 1 / (right - left);
    rh = 1 / (top - bottom);
    rd = 1 / (far - near);

    e = this.elements;

    e[ 0] = 2 * near * rw;
    e[ 1] = 0;
    e[ 2] = 0;
    e[ 3] = 0;

    e[ 4] = 0;
    e[ 5] = 2 * near * rh;
    e[ 6] = 0;
    e[ 7] = 0;

    e[ 8] = (right + left) * rw;
    e[ 9] = (top + bottom) * rh;
    e[10] = -(far + near) * rd;
    e[11] = -1;

    e[12] = 0;
    e[13] = 0;
    e[14] = -2 * near * far * rd;
    e[15] = 0;

    return this;
};

/**
 * Multiple the perspective projection matrix from the right.(右乘透视投影矩阵)
 * @param left The coordinate of the left of clipping plane.
 * @param right The coordinate of the right of clipping plane.
 * @param bottom The coordinate of the bottom of clipping plane.
 * @param top The coordinate of the top clipping plane
 * @param near The distance to the nearer depth clipping plane. This value is minus if the plane is to be behind the viewer
 * @param far The distances to the farther depth clipping plane. This value is minus if plane is to be behind the viewer.
 * @returns {this}
 */
Matrix4.prototype.frustum = function (left, right, bottom, top, near, far) {
    return this.concat(new Matrix4().setFrustum(left, right, bottom, top, near, far));
};

/**
 * Set the perspective projection matrix by fovy and aspect.(通过视角和屏幕的宽高比来设置透视投影矩阵)
 * @param fovy The angle between the upper and lower sides of the frustum.
 * @param aspect The aspect ratio of the frustum.(width/height)
 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
 * @param far The distance to farther depth clipping plane. This value must be plus value.
 * @returns {Matrix4}
 */
Matrix4.prototype.setPerspective = function (fovy, aspect, near, far) {
    var e, rd, s, ct;

    if (near === far || aspect === 0) {
        throw 'null  frustum';
    }
    if (near <= 0) {
        throw  'near <= 0';
    }
    if (far <= 0) {
        throw 'far <= 0';
    }

    fovy = (Math.PI / 180) * fovy / 2;
    s = Math.sin(fovy);

    if (s === 0) {
        throw 'null frustum';
    }

    rd = 1 / (far - near);
    ct = Math.cos(fovy) / s;

    e = this.elements;

    e[ 0] = ct / aspect;
    e[ 1] = 0;
    e[ 2] = 0;
    e[ 3] = 0;

    e[ 4] = 0;
    e[ 5] = 0;
    e[ 6] = 0;
    e[ 7] = 0;

    e[ 8] = 0;
    e[ 9] = 0;
    e[10] = -(far + near) * rd;
    e[11] = -1;

    e[12] = 0;
    e[13] = 0;
    e[14] = -2 * near * far * rd;
    e[15] = 0;

    return this;
};

/**
 * Multiply the perspective projection matrix from the right.(通过视角和屏幕的宽高比来设置透视投影矩阵)
 * @param fovy The angle between the upper and lower sides of the frustum.
 * @param aspect The aspect ratio of the frustum. (width/height)
 * @param near The distances to the nearer depth clipping plane. This value must be plus value.
 * @param far The distances to the farther depth clipping plane. This value must be plus value.
 */
Matrix4.prototype.perspective = function (fovy, aspect, near, far) {
    return this.concat(new Matrix4().setPerspective(fovy, aspect, near, far));
};

/**
 * Set the matrix for scaling.(设置矩阵缩放)
 * @param x The scale factor along the X axis
 * @param y The scale factor along the Y axis
 * @param z The scale factor along the Z axis
 * @returns {Matrix4}
 */
Matrix4.prototype.setScale = function (x, y, z) {
    var e = this.elements;
    e[0] = x;   e[4] = 0;   e[ 8] = 0;  e[12] = 0;
    e[1] = 0;   e[5] = y;   e[ 9] = 0;  e[13] = 0;
    e[2] = 0;   e[6] = 0;   e[10] = z;  e[14] = 0;
    e[3] = 0;   e[7] = 0;   e[11] = 0;  e[15] = 1;
    return this;
};

/**
 * Multiple the matrix for scaling from the right.(通过右乘矩阵来缩放)
 * @param x The scale factor along the X axis
 * @param y The scale factor along the Y axis
 * @param z The scale factor along the Z axis
 * @returns {Matrix4}
 */
Matrix4.prototype.scale = function (x, y, z) {
    var e = this.elements;
    e[0] *= x;  e[4] *= y;  e[ 8] *= z;
    e[1] *= x;  e[5] *= y;  e[ 9] *= z;
    e[2] *= x;  e[6] *= y;  e[10] *= z;
    e[3] *= x;  e[6] *= y;  e[11] *= z;
    return this;
};

/**
 * Set the matrix for translation(设置矩阵平移)
 * @param x The X value of a translation
 * @param y The Y value of a translation
 * @param z The Z value of a translation
 * @returns {Matrix4}
 */
Matrix4.prototype.setTranslate = function (x, y, z) {
    var e = this.elements;
    e[0] = 1;   e[4] = 0;   e[ 8] = 0;  e[12] = x;
    e[1] = 0;   e[5] = 1;   e[ 9] = 0;  e[13] = y;
    e[2] = 0;   e[6] = 0;   e[10] = 1;  e[14] = z;
    e[3] = 0;   e[7] = 0;   e[11] = 0;  e[15] = 1;
    return this;
};

/**
 * Multiple the matrix for translation from the right(右乘矩阵来平移)
 * @param x The X value of a translation
 * @param y The Y value of a translation
 * @param z The Z value of a translation
 * @returns {Matrix4}
 */
Matrix4.prototype.translate = function (x, y, z) {
    var e = this.elements;

    e[12] += e[0] * x + e[4] * y + e[ 8] * z;
    e[13] += e[1] * x + e[5] * y + e[ 9] * z;
    e[14] += e[2] * x + e[6] * y + e[10] * z;
    e[15] += e[3] * x + e[7] * y + e[11] * z;

    return this;
};


/**
 * Constructor of Vector3 三维向量构造器
 * If opt_src is specified, new vector is initialized by opt_src
 * @param opt_src source vector(option) 源向量
 * @constructor
 */
var Vector3 = function (opt_src) {
    var v = new Float32Array(3);
    if (opt_src && typeof opt_src === 'object') {
        v[0] = opt_src[0];
        v[1] = opt_src[1];
        v[2] = opt_src[2];
    }
    this.elements = v;
};

/**
 * Normalize. 标准化
 * @return this
 */
Vector3.prototype.normalize = function () {
    var v = this.elements;
    var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c*c+d*d+e*e);
    if (g) {
        if (g == 1) {
            return this;
        }
    } else {
        v[0] = 0; v[1] = 0; v[2] = 0;
        return this;
    }
    g = 1/g;
    v[0] = c*g; v[1] = d*g; v[2] = e*g;
    return this;
};

/**
 * Constructor of Vector4 四维向量构造器
 * If opt_src is specified, new vector is initialized by opt_src
 * @param opt_src source vector(option)
 * @constructor
 */
var Vector4 = function (opt_src) {
    var v = new Float32Array(4);
    if (opt_src && typeof opt_src === 'object') {
        v[0] = opt_src[0]; v[1] = opt_src[1]; v[2] = opt_src[2]; v[3] = opt_src[3];
    }
    this.elements = v;
}