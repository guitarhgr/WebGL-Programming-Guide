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
        ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];

        e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
        e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
        e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
        e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
    }

    return this;
};
Matrix4.prototype.multiply = Matrix4.prototype.concat;

/**
 * Multiple the three-dimensional vector(乘以三维向量)
 * @param pos The multiple vector(需要乘的矢量)
 * @returns {Vector3} The result of mulitplicaiton(Float 32Array) 乘后的结果(32位的浮点类数组)
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
 * @returns {Vector4} The result of multiplication(Float32Array)
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

    e[0]  = 2 * rw;
    e[1]  = 0;
    e[2]  = 0;
    e[3]  = 0;

    e[4]  = 0;
    e[5]  = 2 * rh;
    e[6]  = 0;
    e[7]  = 0;

    e[8]  = 0;
    e[9]  = 0;
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
        throw 'null frustum';
    }
    if (near <= 0) {
        throw 'near <= 0';
    }
    if (far <= 0) {
        throw 'far <= 0';
    }

    fovy = Math.PI * fovy / 180 / 2;
    s = Math.sin(fovy);
    if (s === 0) {
        throw 'null frustum';
    }

    rd = 1 / (far - near);
    ct = Math.cos(fovy) / s;

    e = this.elements;

    e[0]  = ct / aspect;
    e[1]  = 0;
    e[2]  = 0;
    e[3]  = 0;

    e[4]  = 0;
    e[5]  = ct;
    e[6]  = 0;
    e[7]  = 0;

    e[8]  = 0;
    e[9]  = 0;
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
    e[0] = x;  e[4] = 0;  e[8]  = 0;  e[12] = 0;
    e[1] = 0;  e[5] = y;  e[9]  = 0;  e[13] = 0;
    e[2] = 0;  e[6] = 0;  e[10] = z;  e[14] = 0;
    e[3] = 0;  e[7] = 0;  e[11] = 0;  e[15] = 1;
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
    e[3] *= x;  e[7] *= y;  e[11] *= z;
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
 * Set the matrix for rotation.(设置矩阵旋转)
 * The vector of rotation axis may not be noamalized.
 * @param angle The angle of rotation(degrees)
 * @param x The X coordinate of vector of rotation axis
 * @param y The Y coordinate of vector of rotation axis
 * @param z The Z coordinate of vector of rotation axis
 * @returns {Matrix4}
 */
Matrix4.prototype.setRotate = function (angle, x, y, z) {
    var e, s, c, len, rlen, nc, xy, yz, zx, xs, ys, zs;

    angle = (Math.PI / 180) * angle;
    e = this.elements;

    s = Math.sin(angle);
    c = Math.cos(angle);

    if (0 !== x && 0 === y && 0 === z) {
        // Rotation around X axis
        if (x < 0) {
            s = -s;
        }
        e[0] = 1;   e[4] = 0;   e[ 8] = 0;  e[12] = 0;
        e[1] = 0;   e[5] = c;   e[ 9] =-s;  e[13] = 0;
        e[2] = 0;   e[6] = s;   e[10] = c;  e[14] = 0;
        e[3] = 0;   e[7] = 0;   e[11] = 0;  e[15] = 1;
    } else if (0 === x && 0 !== y && 0 === z) {
        // Rotation around Y axis
        if (y < 0) {
            s = -s;
        }
        e[0] = c;   e[4] = 0;   e[ 8] = s;  e[12] = 0;
        e[1] = 0;   e[5] = 1;   e[ 9] = 0;  e[13] = 0;
        e[2] =-s;   e[6] = 0;   e[10] = c;  e[14] = 0;
        e[3] = 0;   e[7] = 0;   e[11] = 0;  e[15] = 1;
    } else if (0 === x && 0 === y && 0 !== z) {
        // Rotation around Z axis
        if (z < 0) {
            s = -s;
        }
        e[0] = c;   e[4] =-s;   e[ 8] = 0;  e[12] = 0;
        e[1] = s;   e[5] = c;   e[ 9] = 0;  e[13] = 0;
        e[2] = 0;   e[6] = 0;   e[10] = 1;  e[14] = 0;
        e[3] = 0;   e[7] = 0;   e[11] = 0;  e[15] = 1;
    } else {
        // Rotation around another axis
        len = Math.sqrt(x*x + y*y + z*z);
        if (len !== 1) {
            rlen = 1 / len;
            x *= rlen;
            y *= rlen;
            z *= rlen;
        }
        nc = 1 - c;
        xy = x * y;
        yz = y * z;
        zx = z * x;
        xs = x * s;
        ys = y * s;
        zs = z * s;

        e[ 0] = x*x*nc + c;
        e[ 1] = xy *nc + zs;
        e[ 2] = zx *nc - ys;
        e[ 3] = 0;

        e[ 4] = xy *nc - zs;
        e[ 5] = y*y*nc + c;
        e[ 6] = yz *nc + xs;
        e[ 7] = 0;

        e[ 8] = zx *nc + ys;
        e[ 9] = yz *nc - xs;
        e[10] = z*z*nc + c;
        e[11] = 0;

        e[12] = 0;
        e[13] = 0;
        e[14] = 0;
        e[15] = 1;
    }

    return this;
};

/**
 * Multiply the matrix for rotation from the right.
 * The vector of rotation axis may not be normalized.
 * @param angle The angle of rotation (degrees)
 * @param x The X coordinate of vector of rotation axis.
 * @param y The Y coordinate of vector of rotation axis.
 * @param z The Z coordinate of vector of rotation axis.
 * @returns {this}
 */
Matrix4.prototype.rotate = function (angle, x, y, z) {
    return this.concat(new Matrix4().setRotate(angle, x, y, z));
};

/**
 * Set the viewing matrix
 * @param eyeX The position of the eye point.
 * @param eyeY
 * @param eyeZ
 * @param centerX The position of the reference point.
 * @param centerY
 * @param centerZ
 * @param upX The direction of the up vector.
 * @param upY
 * @param upZ
 * @returns {Matrix4|this}
 */
Matrix4.prototype.setLookAt = function (eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
    var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

    fx = centerX - eyeX;
    fy = centerY - eyeY;
    fz = centerZ - eyeZ;

    // Normalize f.
    rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
    fx *= rlf;
    fy *= rlf;
    fz *= rlf;

    // Calculate cross product of f and up.
    sx = fy * upZ - fz * upY;
    sy = fz * upX - fx * upZ;
    sz = fx * upY - fy * upX;

    // Normalize x.
    rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
    sx *= rls;
    sy *= rls;
    sz *= rls;

    // Calculate cross product of s and f.
    ux = sy * fz - sz * fy;
    uy = sz * fx - sx * fz;
    uz = sx * fy - sy * fx;

    // Set to this
    e = this.elements;
    e[ 0] = sx;
    e[ 1] = ux;
    e[ 2] = -fx;
    e[ 3] = 0;

    e[ 4] = sy;
    e[ 5] = uy;
    e[ 6] = -fy;
    e[ 7] = 0;

    e[ 8] = sz;
    e[ 9] = uz;
    e[10] = -fz;
    e[11] = 0;

    e[12] = 0;
    e[13] = 0;
    e[14] = 0;
    e[15] = 1;

    return this.translate(-eyeX, -eyeY, -eyeZ);
};

/**
 * Multiple the viewing matrix from the right
 * @param eyeX The position of the eye point.
 * @param eyeY
 * @param eyeZ
 * @param centerX The position of the reference point.
 * @param centerY
 * @param centerZ
 * @param upX The direction of the up vector.
 * @param upY
 * @param upZ
 * @returns {this}
 */
Matrix4.prototype.lookAt = function (eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
    return this.concat(new Matrix4().setLookAt(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ));
};

/**
 * Multiply the matrix for project vertex to plane
 * @param plane The array[A, B, C, D] of the equation of plane "Ax + By + Cz + D = 0"
 * @param light The array which stored coordinates of the light. if light[3]=0, treated as parallel light.
 * @returns {this}
 */
Matrix4.prototype.dropShadow = function (plane, light) {
    var mat = new Matrix4();
    var e = mat.elements;

    var dot = plane[0] * light[0] + plane[1] * light[1] + plane[2] * light[2] + plane[3] * light[3];

    e[ 0] = dot - light[0] * plane[0];
    e[ 1] =     - light[1] * plane[0];
    e[ 2] =     - light[2] * plane[0];
    e[ 3] =     - light[3] * plane[0];

    e[ 4] =     - light[0] * plane[1];
    e[ 5] = dot - light[1] * plane[1];
    e[ 6] =     - light[2] * plane[1];
    e[ 7] =     - light[3] * plane[1];

    e[ 8] =     - light[0] * plane[2];
    e[ 9] =     - light[1] * plane[2];
    e[10] = dot - light[2] * plane[2];
    e[11] =     - light[3] * plane[2];

    e[12] =     - light[0] * plane[3];
    e[13] =     - light[1] * plane[3];
    e[14] =     - light[2] * plane[3];
    e[15] = dot - light[3] * plane[3];

    return this.concat(mat);
};

/**
 * Multiple the matrix for project vertex to plane from the right.(Projected by parallel light)
 * @param normX The normal vector of the plane.(Not necessary to be normalized.)
 * @param normY
 * @param normZ
 * @param planeX The coordinate of arbitrary points on a plane.
 * @param planeY
 * @param planeZ
 * @param lightX The vector of the direction of light.(Not necessary to be normalized.)
 * @param lightY
 * @param lightZ
 * @returns {this}
 */
Matrix4.prototype.dropShadowDirectionally = function (normX, normY, normZ, planeX, planeY, planeZ, lightX, lightY, lightZ) {
    var a = planeX * normX + planeY * normY + planeZ * normZ;
    return this.dropShadow([normX, normY, normZ, -a], [lightX, lightY, lightZ, 0]);
}

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