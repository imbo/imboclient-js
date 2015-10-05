/**
 * This is based on the following work:
 *
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256,
 * as defined in FIPS 180-2
 *
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 */

/* eslint no-bitwise: 0 */
'use strict';

var chrsz = 8;

var safeAdd = function(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
};

var s = function(X, n) {
    return (X >>> n) | (X << (32 - n));
};

var r = function(X, n) {
    return (X >>> n);
};

var ch = function(x, y, z) {
    return ((x & y) ^ ((~x) & z));
};

var maj = function(x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z));
};

var sigma0256 = function(x) {
    return (s(x, 2) ^ s(x, 13) ^ s(x, 22));
};

var sigma1256 = function(x) {
    return (s(x, 6) ^ s(x, 11) ^ s(x, 25));
};

var gamma0256 = function(x) {
    return (s(x, 7) ^ s(x, 18) ^ r(x, 3));
};

var gamma1256 = function(x) {
    return (s(x, 17) ^ s(x, 19) ^ r(x, 10));
};

var coreSha256 = function(m, l) {
    var K = [
        0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98,
        0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786,
        0xFC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8,
        0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x6CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
        0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819,
        0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A,
        0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7,
        0xC67178F2
    ];
    var HASH = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;

    // append padding
    m[l >> 5] |= 0x80 << (24 - l % 32);
    m[((l + 64 >> 9) << 4) + 15] = l;

    for (i = 0; i < m.length; i += 16) {
        a = HASH[0];
        b = HASH[1];
        c = HASH[2];
        d = HASH[3];
        e = HASH[4];
        f = HASH[5];
        g = HASH[6];
        h = HASH[7];

        for (j = 0; j < 64; j++) {
            if (j < 16) {
                W[j] = m[j + i];
            } else {
                W[j] = safeAdd(safeAdd(safeAdd(gamma1256(W[j - 2]), W[j - 7]), gamma0256(W[j - 15])), W[j - 16]);
            }
            T1 = safeAdd(safeAdd(safeAdd(safeAdd(h, sigma1256(e)), ch(e, f, g)), K[j]), W[j]);
            T2 = safeAdd(sigma0256(a), maj(a, b, c));

            h = g;
            g = f;
            f = e;
            e = safeAdd(d, T1);
            d = c;
            c = b;
            b = a;
            a = safeAdd(T1, T2);
        }

        HASH[0] = safeAdd(a, HASH[0]);
        HASH[1] = safeAdd(b, HASH[1]);
        HASH[2] = safeAdd(c, HASH[2]);
        HASH[3] = safeAdd(d, HASH[3]);
        HASH[4] = safeAdd(e, HASH[4]);
        HASH[5] = safeAdd(f, HASH[5]);
        HASH[6] = safeAdd(g, HASH[6]);
        HASH[7] = safeAdd(h, HASH[7]);
    }

    return HASH;
};

var str2binb = function(str) {
    var bin = [];
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
    }
    return bin;
};

var binb2hex = function(binarray) {
    var hexTab = '0123456789abcdef', str = '';
    for (var i = 0; i < binarray.length * 4; i++) {
        str += (
            hexTab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
            hexTab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF)
        );
    }
    return str;
};

var coreHmacSha256 = function(key, data) {
    var bkey = str2binb(key);
    if (bkey.length > 16) {
        bkey = coreSha256(bkey, key.length * chrsz);
    }

    var ipad = new Array(16), opad = new Array(16);
    for (var i = 0; i < 16; i++) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }

    var hash = coreSha256(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
    return coreSha256(opad.concat(hash), 512 + 256);
};

exports.sha256hmac = function(key, data) {
    return binb2hex(coreHmacSha256(key, data));
};
