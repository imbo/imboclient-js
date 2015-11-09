/**
 * @preserve A JavaScript implementation of the SHA family of hashes, as
 * defined in FIPS PUB 180-2 as well as the corresponding HMAC implementation
 * as defined in FIPS PUB 198a
 *
 * Copyright Brian Turek 2008-2015
 * Distributed under the BSD License
 * See http://caligatio.github.com/jsSHA/ for more information
 *
 * Several functions taken from Paul Johnston
 * Stripped by Espen Hovlandsdal to only include the methods required for
 * hmac-sha256 in utf8 format, used in imboclient-js
 */

/* eslint-disable */
'use strict';

/**
 * Convert a string to an array of big-endian words
 *
 * There is a known bug with an odd number of existing bytes and using a
 * UTF-16 encoding.  However, this function is used such that the existing
 * bytes are always a result of a previous UTF-16 str2binb call and
 * therefore there should never be an odd number of existing bytes
 *
 * @private
 * @param {string} str String to be converted to binary representation
 * @param {string} utfType The Unicode type, UTF8 or UTF16BE, UTF16LE, to
 *   use to encode the source string
 * @param {Array.<number>} existingBin A packed int array of bytes to
 *   append the results to
 * @param {number} existingBinLen The number of bits in the existingBin
 *   array
 * @return {{value : Array.<number>, binLen : number}} Hash list where
 *   "value" contains the output number array and "binLen" is the binary
 *   length of "value"
 */
function str2binb(str, utfType, existingBin, existingBinLen) {
    var bin = [], codePnt, binArr = [], byteCnt = 0, i, j, existingByteLen,
        intOffset, byteOffset;

    bin = existingBin || [0];
    existingBinLen = existingBinLen || 0;
    existingByteLen = existingBinLen >>> 3;

    for (i = 0; i < str.length; i += 1)
    {
        codePnt = str.charCodeAt(i);
        binArr = [];

        if (0x80 > codePnt)
        {
            binArr.push(codePnt);
        }
        else if (0x800 > codePnt)
        {
            binArr.push(0xC0 | (codePnt >>> 6));
            binArr.push(0x80 | (codePnt & 0x3F));
        }
        else if ((0xd800 > codePnt) || (0xe000 <= codePnt)) {
            binArr.push(
                0xe0 | (codePnt >>> 12),
                0x80 | ((codePnt >>> 6) & 0x3f),
                0x80 | (codePnt & 0x3f)
            );
        }
        else
        {
            i += 1;
            codePnt = 0x10000 + (((codePnt & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
            binArr.push(
                0xf0 | (codePnt >>> 18),
                0x80 | ((codePnt >>> 12) & 0x3f),
                0x80 | ((codePnt >>> 6) & 0x3f),
                0x80 | (codePnt & 0x3f)
            );
        }

        for (j = 0; j < binArr.length; j += 1)
        {
            byteOffset = byteCnt + existingByteLen;
            intOffset = byteOffset >>> 2;
            while (bin.length <= intOffset)
            {
                bin.push(0);
            }
            /* Known bug kicks in here */
            bin[intOffset] |= binArr[j] << (8 * (3 - (byteOffset % 4)));
            byteCnt += 1;
        }
    }

    return {"value" : bin, "binLen" : byteCnt * 8 + existingBinLen};
}

/**
 * Convert an array of big-endian words to a hex string.
 *
 * @private
 * @param {Array.<number>} binarray Array of integers to be converted to
 *   hexidecimal representation
 * @param {{b64Pad : string}} formatOpts Hash list
 *   containing validated output formatting options
 * @return {string} Hexidecimal representation of the parameter in string
 *   form
 */
function binb2hex(binarray, formatOpts)
{
    var hex_tab = "0123456789abcdef", str = "",
        length = binarray.length * 4, i, srcByte;

    for (i = 0; i < length; i += 1)
    {
        /* The below is more than a byte but it gets taken care of later */
        srcByte = binarray[i >>> 2] >>> ((3 - (i % 4)) * 8);
        str += hex_tab.charAt((srcByte >>> 4) & 0xF) +
            hex_tab.charAt(srcByte & 0xF);
    }

    return str;
}

/**
 * Validate hash list containing output formatting options, ensuring
 * presence of every option or adding the default value
 *
 * @private
 * @param {{outputUpper : (boolean|undefined), b64Pad : (string|undefined)}=}
 *   options Hash list of output formatting options
 * @return {{outputUpper : boolean, b64Pad : string}} Validated hash list
 *   containing output formatting options
 */
function getOutputOpts(options)
{
    var retVal = {"outputUpper" : false, "b64Pad" : "="}, outputOptions;
    outputOptions = options || {};

    return retVal;
}

/**
 * Function that takes an input format and UTF encoding and returns the
 * appropriate function used to convert the input.
 *
 * @private
 * @param {string} format The format of the string to be converted
 * @param {string} utfType The string encoding to use (UTF8, UTF16BE,
 *  UTF16LE)
 * @return {function(string, Array.<number>=, number=): {value :
 *   Array.<number>, binLen : number}} Function that will convert an input
 *   string to a packed int array
 */
function getStrConverter(format, utfType)
{
    return function(str, existingBin, existingBinLen) {
        return str2binb(str, utfType, existingBin, existingBinLen);
    };
}

/**
 * The 32-bit implementation of circular rotate right
 *
 * @private
 * @param {number} x The 32-bit integer argument
 * @param {number} n The number of bits to shift
 * @return {number} The x shifted circularly by n bits
 */
function rotr_32(x, n)
{
    return (x >>> n) | (x << (32 - n));
}

/**
 * The 32-bit implementation of shift right
 *
 * @private
 * @param {number} x The 32-bit integer argument
 * @param {number} n The number of bits to shift
 * @return {number} The x shifted by n bits
 */
function shr_32(x, n)
{
    return x >>> n;
}

/**
 * The 32-bit implementation of the NIST specified Ch function
 *
 * @private
 * @param {number} x The first 32-bit integer argument
 * @param {number} y The second 32-bit integer argument
 * @param {number} z The third 32-bit integer argument
 * @return {number} The NIST specified output of the function
 */
function ch_32(x, y, z)
{
    return (x & y) ^ (~x & z);
}

/**
 * The 32-bit implementation of the NIST specified Maj function
 *
 * @private
 * @param {number} x The first 32-bit integer argument
 * @param {number} y The second 32-bit integer argument
 * @param {number} z The third 32-bit integer argument
 * @return {number} The NIST specified output of the function
 */
function maj_32(x, y, z)
{
    return (x & y) ^ (x & z) ^ (y & z);
}

/**
 * The 32-bit implementation of the NIST specified Sigma0 function
 *
 * @private
 * @param {number} x The 32-bit integer argument
 * @return {number} The NIST specified output of the function
 */
function sigma0_32(x)
{
    return rotr_32(x, 2) ^ rotr_32(x, 13) ^ rotr_32(x, 22);
}

/**
 * The 32-bit implementation of the NIST specified Sigma1 function
 *
 * @private
 * @param {number} x The 32-bit integer argument
 * @return {number} The NIST specified output of the function
 */
function sigma1_32(x)
{
    return rotr_32(x, 6) ^ rotr_32(x, 11) ^ rotr_32(x, 25);
}

/**
 * The 32-bit implementation of the NIST specified Gamma0 function
 *
 * @private
 * @param {number} x The 32-bit integer argument
 * @return {number} The NIST specified output of the function
 */
function gamma0_32(x)
{
    return rotr_32(x, 7) ^ rotr_32(x, 18) ^ shr_32(x, 3);
}

/**
 * The 32-bit implementation of the NIST specified Gamma1 function
 *
 * @private
 * @param {number} x The 32-bit integer argument
 * @return {number} The NIST specified output of the function
 */
function gamma1_32(x)
{
    return rotr_32(x, 17) ^ rotr_32(x, 19) ^ shr_32(x, 10);
}

/**
 * Add two 32-bit integers, wrapping at 2^32. This uses 16-bit operations
 * internally to work around bugs in some JS interpreters.
 *
 * @private
 * @param {number} a The first 32-bit integer argument to be added
 * @param {number} b The second 32-bit integer argument to be added
 * @return {number} The sum of a + b
 */
function safeAdd_32_2(a, b)
{
    var lsw = (a & 0xFFFF) + (b & 0xFFFF),
        msw = (a >>> 16) + (b >>> 16) + (lsw >>> 16);

    return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
}

/**
 * Add four 32-bit integers, wrapping at 2^32. This uses 16-bit operations
 * internally to work around bugs in some JS interpreters.
 *
 * @private
 * @param {number} a The first 32-bit integer argument to be added
 * @param {number} b The second 32-bit integer argument to be added
 * @param {number} c The third 32-bit integer argument to be added
 * @param {number} d The fourth 32-bit integer argument to be added
 * @return {number} The sum of a + b + c + d
 */
function safeAdd_32_4(a, b, c, d)
{
    var lsw = (a & 0xFFFF) + (b & 0xFFFF) + (c & 0xFFFF) + (d & 0xFFFF),
        msw = (a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) +
            (lsw >>> 16);

    return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
}

/**
 * Add five 32-bit integers, wrapping at 2^32. This uses 16-bit operations
 * internally to work around bugs in some JS interpreters.
 *
 * @private
 * @param {number} a The first 32-bit integer argument to be added
 * @param {number} b The second 32-bit integer argument to be added
 * @param {number} c The third 32-bit integer argument to be added
 * @param {number} d The fourth 32-bit integer argument to be added
 * @param {number} e The fifth 32-bit integer argument to be added
 * @return {number} The sum of a + b + c + d + e
 */
function safeAdd_32_5(a, b, c, d, e)
{
    var lsw = (a & 0xFFFF) + (b & 0xFFFF) + (c & 0xFFFF) + (d & 0xFFFF) +
            (e & 0xFFFF),
        msw = (a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) +
            (e >>> 16) + (lsw >>> 16);

    return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
}

/**
 * Gets the H values for the specified SHA variant
 *
 * @param {string} variant The SHA variant
 * @return {Array.<number|Int_64>} The initial H values
 */
function getH(variant)
{
    return [
        0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
        0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
    ];
}

/* Put this here so the K arrays aren't put on the stack for every block */
var K_sha2 = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
    0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
    0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
    0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
    0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
    0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
    0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
    0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
    0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
];

/**
 * Performs a round of SHA-2 hashing over a block
 *
 * @private
 * @param {Array.<number>} block The binary array representation of the
 *   block to hash
 * @param {Array.<number|Int_64>} H The intermediate H values from a previous
 *   round
 * @param {string} variant The desired SHA-2 variant
 * @return {Array.<number|Int_64>} The resulting H values
 */
function roundSHA2(block, H, variant)
{
    var a, b, c, d, e, f, g, h, T1, T2, numRounds, t, binaryStringMult,
        safeAdd_2, safeAdd_4, safeAdd_5, gamma0, gamma1, sigma0, sigma1,
        ch, maj, Int, W = [], int1, int2, offset, K;


    /* 32-bit variant */
    numRounds = 64;
    binaryStringMult = 1;
    Int = Number;
    safeAdd_2 = safeAdd_32_2;
    safeAdd_4 = safeAdd_32_4;
    safeAdd_5 = safeAdd_32_5;
    gamma0 = gamma0_32;
    gamma1 = gamma1_32;
    sigma0 = sigma0_32;
    sigma1 = sigma1_32;
    maj = maj_32;
    ch = ch_32;
    K = K_sha2;

    a = H[0];
    b = H[1];
    c = H[2];
    d = H[3];
    e = H[4];
    f = H[5];
    g = H[6];
    h = H[7];

    for (t = 0; t < numRounds; t += 1)
    {
        if (t < 16)
        {
            offset = t * binaryStringMult;
            int1 = (block.length <= offset) ? 0 : block[offset];
            int2 = (block.length <= offset + 1) ? 0 : block[offset + 1];
            /* Bit of a hack - for 32-bit, the second term is ignored */
            W[t] = new Int(int1, int2);
        }
        else
        {
            W[t] = safeAdd_4(
                    gamma1(W[t - 2]), W[t - 7],
                    gamma0(W[t - 15]), W[t - 16]
                );
        }

        T1 = safeAdd_5(h, sigma1(e), ch(e, f, g), K[t], W[t]);
        T2 = safeAdd_2(sigma0(a), maj(a, b, c));
        h = g;
        g = f;
        f = e;
        e = safeAdd_2(d, T1);
        d = c;
        c = b;
        b = a;
        a = safeAdd_2(T1, T2);
    }

    H[0] = safeAdd_2(a, H[0]);
    H[1] = safeAdd_2(b, H[1]);
    H[2] = safeAdd_2(c, H[2]);
    H[3] = safeAdd_2(d, H[3]);
    H[4] = safeAdd_2(e, H[4]);
    H[5] = safeAdd_2(f, H[5]);
    H[6] = safeAdd_2(g, H[6]);
    H[7] = safeAdd_2(h, H[7]);

    return H;
}

/**
 * Finalizes the SHA-2 hash
 *
 * @private
 * @param {Array.<number>} remainder Any leftover unprocessed packed ints
 *   that still need to be processed
 * @param {number} remainderBinLen The number of bits in remainder
 * @param {number} processedBinLen The number of bits already
 *   processed
 * @param {Array.<number|Int_64>} H The intermediate H values from a previous
 *   round
 * @param {string} variant The desired SHA-2 variant
 * @return {Array.<number>} The array of integers representing the SHA-2
 *   hash of message
 */
function finalizeSHA2(remainder, remainderBinLen, processedBinLen, H, variant)
{
    var i, appendedMessageLength, offset, binaryStringInc;

    /* 32-bit variant */
    /* The 65 addition is a hack but it works.  The correct number is
       actually 72 (64 + 8) but the below math fails if
       remainderBinLen + 72 % 512 = 0. Since remainderBinLen % 8 = 0,
       "shorting" the addition is OK. */
    offset = (((remainderBinLen + 65) >>> 9) << 4) + 15;
    binaryStringInc = 16;

    while (remainder.length <= offset)
    {
        remainder.push(0);
    }
    /* Append '1' at the end of the binary string */
    remainder[remainderBinLen >>> 5] |= 0x80 << (24 - remainderBinLen % 32);
    /* Append length of binary string in the position such that the new
     * length is correct */
    remainder[offset] = remainderBinLen + processedBinLen;

    appendedMessageLength = remainder.length;

    /* This will always be at least 1 full chunk */
    for (i = 0; i < appendedMessageLength; i += binaryStringInc)
    {
        H = roundSHA2(remainder.slice(i, i + binaryStringInc), H, variant);
    }

    return H;
}

/**
 * jsSHA is the workhorse of the library.  Instantiate it with the string to
 * be hashed as the parameter
 *
 * @constructor
 * @this {jsSHA}
 * @param {string} variant The desired SHA variant (SHA-1, SHA-224, SHA-256,
 *   SHA-384, or SHA-512)
 * @param {string} inputFormat The format of srcString: HEX, TEXT, B64, or BYTES
 * @param {{encoding: (string|undefined), numRounds: (string|undefined)}=}
 *   options Optional values
 */
var jsSHA = function(variant, inputFormat, options)
{
    var processedLen = 0, remainder = [], remainderLen = 0, utfType,
        intermediateH, converterFunc, shaVariant = variant, outputBinLen,
        variantBlockSize, roundFunc, finalizeFunc, finalized = false,
        hmacKeySet = false, keyWithIPad = [], keyWithOPad = [], numRounds,
        updatedCalled = false, inputOptions;

    inputOptions = options || {};
    utfType = inputOptions["encoding"] || "UTF8";
    numRounds = inputOptions["numRounds"] || 1;

    converterFunc = getStrConverter(inputFormat, utfType);

    roundFunc = function (block, H) {
        return roundSHA2(block, H, shaVariant);
    };
    finalizeFunc = function (remainder, remainderBinLen, processedBinLen, H) {
        return finalizeSHA2(remainder, remainderBinLen, processedBinLen, H, shaVariant);
    };

    variantBlockSize = 512;
    outputBinLen = 256;

    intermediateH = getH(shaVariant);

    /**
     * Sets the HMAC key for an eventual getHMAC call.  Must be called
     * immediately after jsSHA object instantiation
     *
     * @expose
     * @param {string} key The key used to calculate the HMAC
     * @param {string} inputFormat The format of key, HEX, TEXT, B64, or BYTES
     * @param {{encoding : (string|undefined)}=} options Associative array
     *   of input format options
     */
    this.setHMACKey = function(key, inputFormat, options)
    {
        var keyConverterFunc, convertRet, keyBinLen, keyToUse, blockByteSize,
            i, lastArrayIndex, keyOptions;

        keyOptions = options || {};
        utfType = keyOptions["encoding"] || "UTF8";

        keyConverterFunc = getStrConverter(inputFormat, utfType);

        convertRet = keyConverterFunc(key);
        keyBinLen = convertRet["binLen"];
        keyToUse = convertRet["value"];

        blockByteSize = variantBlockSize >>> 3;

        /* These are used multiple times, calculate and store them */
        lastArrayIndex = (blockByteSize / 4) - 1;

        /* Figure out what to do with the key based on its size relative to
         * the hash's block size */
        if (blockByteSize < (keyBinLen / 8))
        {
            keyToUse = finalizeFunc(keyToUse, keyBinLen, 0, getH(shaVariant));
            /* For all variants, the block size is bigger than the output
             * size so there will never be a useful byte at the end of the
             * string */
            while (keyToUse.length <= lastArrayIndex)
            {
                keyToUse.push(0);
            }
            keyToUse[lastArrayIndex] &= 0xFFFFFF00;
        }
        else if (blockByteSize > (keyBinLen / 8))
        {
            /* If the blockByteSize is greater than the key length, there
             * will always be at LEAST one "useless" byte at the end of the
             * string */
            while (keyToUse.length <= lastArrayIndex)
            {
                keyToUse.push(0);
            }
            keyToUse[lastArrayIndex] &= 0xFFFFFF00;
        }

        /* Create ipad and opad */
        for (i = 0; i <= lastArrayIndex; i += 1)
        {
            keyWithIPad[i] = keyToUse[i] ^ 0x36363636;
            keyWithOPad[i] = keyToUse[i] ^ 0x5C5C5C5C;
        }

        intermediateH = roundFunc(keyWithIPad, intermediateH);
        processedLen = variantBlockSize;

        hmacKeySet = true;
    };

    /**
     * Takes strString and hashes as many blocks as possible.  Stores the
     * rest for either a future update or getHash call.
     *
     * @expose
     * @param {string} srcString The string to be hashed
     */
    this.update = function(srcString)
    {
        var convertRet, chunkBinLen, chunkIntLen, chunk, i, updateProcessedLen = 0,
            variantBlockIntInc = variantBlockSize >>> 5;

        convertRet = converterFunc(srcString, remainder, remainderLen);
        chunkBinLen = convertRet["binLen"];
        chunk = convertRet["value"];

        chunkIntLen = chunkBinLen >>> 5;
        for (i = 0; i < chunkIntLen; i += variantBlockIntInc)
        {
            if (updateProcessedLen + variantBlockSize <= chunkBinLen)
            {
                intermediateH = roundFunc(
                    chunk.slice(i, i + variantBlockIntInc),
                    intermediateH
                );
                updateProcessedLen += variantBlockSize;
            }
        }
        processedLen += updateProcessedLen;
        remainder = chunk.slice(updateProcessedLen >>> 5);
        remainderLen = chunkBinLen % variantBlockSize;
        updatedCalled = true;
    };

    /**
     * Returns the the HMAC in the specified format using the key given by
     * a previous setHMACKey call.
     *
     * @expose
     * @param {string} format The desired output formatting
     *   (B64, HEX, or BYTES)
     * @param {{outputUpper : (boolean|undefined), b64Pad : (string|undefined)}=}
     *   options associative array of output formatting options
     * @return {string} The string representation of the hash in the format
     *   specified
     */
    this.getHMAC = function(format, options)
    {
        var formatFunc, firstHash, outputOptions;

        outputOptions = getOutputOpts(options);

        formatFunc = function(binarray) {return binb2hex(binarray, outputOptions);};

        firstHash = finalizeFunc(remainder, remainderLen, processedLen, intermediateH);
        intermediateH = roundFunc(keyWithOPad, getH(shaVariant));
        intermediateH = finalizeFunc(firstHash, outputBinLen, variantBlockSize, intermediateH);

        finalized = true;
        return formatFunc(intermediateH);
    };
};

module.exports = jsSHA;
/* eslint-enable */
