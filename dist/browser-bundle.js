!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Imbo=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

exports.Client = _dereq_('./lib/client');
exports.Url = _dereq_('./lib/url/url');
exports.ImageUrl = _dereq_('./lib/url/imageurl');
exports.ShortUrl = _dereq_('./lib/url/shorturl');
exports.Query = _dereq_('./lib/query');
exports.Version = _dereq_('./package.json').version;

},{"./lib/client":9,"./lib/query":10,"./lib/url/imageurl":11,"./lib/url/shorturl":12,"./lib/url/url":13,"./package.json":19}],2:[function(_dereq_,module,exports){
(function (process){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Checks if webworkers are supported
 *
 * @return {Boolean}
 */
var supportsWebWorkers = function() {
    if (typeof window.Worker === 'undefined' || typeof window.URL === 'undefined') {
        return false;
    }

    try {
        /* eslint-disable no-new */
        new Worker(window.URL.createObjectURL(
            new Blob([''], { type: 'text/javascript' })
        ));
        /* eslint-enable no-new */
    } catch (e) {
        return false;
    }

    return true;
};

var Sha = _dereq_('./sha'),
    md5 = _dereq_('./md5.min'),
    readers = _dereq_('./readers');

var isBrowser = typeof window !== 'undefined',
    supportsWorkers = isBrowser && supportsWebWorkers(),
    workerQueue = [],
    md5Worker;

/**
 * Process the next MD5 task in the queue (if any)
 *
 */
var nextMd5Task = function() {
    if (workerQueue.length > 1) {
        // Worker should already be processing, next task
        // will be run once the current one is done
        return;
    } else if (workerQueue.length) {
        // Only one item in queue? Let the worker process it now
        md5Worker.postMessage(workerQueue[0].buffer);
    }
};

/**
 * Add a new MD5 task to the queue
 *
 * @param {ArrayBuffer} buffer - Buffer containing the file data
 * @param {Function} callback  - Callback to run when the MD5 task has been completed
 */
var addMd5Task = function(buffer, callback) {
    if (supportsWorkers) {
        // We have a worker queue, push an item into it and start processing
        workerQueue.push({ buffer: buffer, callback: callback });
        nextMd5Task();
    } else {
        // We don't have any Web Worker support,
        // queue an MD5 operation on the next tick
        process.nextTick(function() {
            callback(null, md5.ArrayBuffer.hash(buffer));
        });
    }
};

// Initialize the web worker for generating MD5 hashes if supported
if (supportsWorkers) {
    // Set up the actual web worker
    md5Worker = new Worker(window.URL.createObjectURL(new Blob(['(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module \'"+o+"\'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){\n/* global self */\n\'use strict\';\nvar md5 = require(\'./md5.min\');\nself.onmessage = function(e) {\n    self.postMessage(md5.ArrayBuffer.hash(e.data));\n};\n\n},{"./md5.min":2}],2:[function(require,module,exports){\n(function(r){module.exports=r()})(function(r){"use strict";var n=function(r,n){return r+n&4294967295},t=function(r,t,u,e,o,f){t=n(n(t,r),n(e,f));return n(t<<o|t>>>32-o,u)},u=function(r,n,u,e,o,f,a){return t(n&u|~n&e,r,n,o,f,a)},e=function(r,n,u,e,o,f,a){return t(n&e|u&~e,r,n,o,f,a)},o=function(r,n,u,e,o,f,a){return t(n^u^e,r,n,o,f,a)},f=function(r,n,u,e,o,f,a){return t(u^(n|~e),r,n,o,f,a)},a=function(r,t){var a=r[0],i=r[1],c=r[2],h=r[3];a=u(a,i,c,h,t[0],7,-680876936);h=u(h,a,i,c,t[1],12,-389564586);c=u(c,h,a,i,t[2],17,606105819);i=u(i,c,h,a,t[3],22,-1044525330);a=u(a,i,c,h,t[4],7,-176418897);h=u(h,a,i,c,t[5],12,1200080426);c=u(c,h,a,i,t[6],17,-1473231341);i=u(i,c,h,a,t[7],22,-45705983);a=u(a,i,c,h,t[8],7,1770035416);h=u(h,a,i,c,t[9],12,-1958414417);c=u(c,h,a,i,t[10],17,-42063);i=u(i,c,h,a,t[11],22,-1990404162);a=u(a,i,c,h,t[12],7,1804603682);h=u(h,a,i,c,t[13],12,-40341101);c=u(c,h,a,i,t[14],17,-1502002290);i=u(i,c,h,a,t[15],22,1236535329);a=e(a,i,c,h,t[1],5,-165796510);h=e(h,a,i,c,t[6],9,-1069501632);c=e(c,h,a,i,t[11],14,643717713);i=e(i,c,h,a,t[0],20,-373897302);a=e(a,i,c,h,t[5],5,-701558691);h=e(h,a,i,c,t[10],9,38016083);c=e(c,h,a,i,t[15],14,-660478335);i=e(i,c,h,a,t[4],20,-405537848);a=e(a,i,c,h,t[9],5,568446438);h=e(h,a,i,c,t[14],9,-1019803690);c=e(c,h,a,i,t[3],14,-187363961);i=e(i,c,h,a,t[8],20,1163531501);a=e(a,i,c,h,t[13],5,-1444681467);h=e(h,a,i,c,t[2],9,-51403784);c=e(c,h,a,i,t[7],14,1735328473);i=e(i,c,h,a,t[12],20,-1926607734);a=o(a,i,c,h,t[5],4,-378558);h=o(h,a,i,c,t[8],11,-2022574463);c=o(c,h,a,i,t[11],16,1839030562);i=o(i,c,h,a,t[14],23,-35309556);a=o(a,i,c,h,t[1],4,-1530992060);h=o(h,a,i,c,t[4],11,1272893353);c=o(c,h,a,i,t[7],16,-155497632);i=o(i,c,h,a,t[10],23,-1094730640);a=o(a,i,c,h,t[13],4,681279174);h=o(h,a,i,c,t[0],11,-358537222);c=o(c,h,a,i,t[3],16,-722521979);i=o(i,c,h,a,t[6],23,76029189);a=o(a,i,c,h,t[9],4,-640364487);h=o(h,a,i,c,t[12],11,-421815835);c=o(c,h,a,i,t[15],16,530742520);i=o(i,c,h,a,t[2],23,-995338651);a=f(a,i,c,h,t[0],6,-198630844);h=f(h,a,i,c,t[7],10,1126891415);c=f(c,h,a,i,t[14],15,-1416354905);i=f(i,c,h,a,t[5],21,-57434055);a=f(a,i,c,h,t[12],6,1700485571);h=f(h,a,i,c,t[3],10,-1894986606);c=f(c,h,a,i,t[10],15,-1051523);i=f(i,c,h,a,t[1],21,-2054922799);a=f(a,i,c,h,t[8],6,1873313359);h=f(h,a,i,c,t[15],10,-30611744);c=f(c,h,a,i,t[6],15,-1560198380);i=f(i,c,h,a,t[13],21,1309151649);a=f(a,i,c,h,t[4],6,-145523070);h=f(h,a,i,c,t[11],10,-1120210379);c=f(c,h,a,i,t[2],15,718787259);i=f(i,c,h,a,t[9],21,-343485551);r[0]=n(a,r[0]);r[1]=n(i,r[1]);r[2]=n(c,r[2]);r[3]=n(h,r[3])},i=function(r){var n=[],t;for(t=0;t<64;t+=4){n[t>>2]=r.charCodeAt(t)+(r.charCodeAt(t+1)<<8)+(r.charCodeAt(t+2)<<16)+(r.charCodeAt(t+3)<<24)}return n},c=function(r){var n=[],t;for(t=0;t<64;t+=4){n[t>>2]=r[t]+(r[t+1]<<8)+(r[t+2]<<16)+(r[t+3]<<24)}return n},h=function(r){var n=r.length,t=[1732584193,-271733879,-1732584194,271733878],u,e,o,f,c,h;for(u=64;u<=n;u+=64){a(t,i(r.substring(u-64,u)))}r=r.substring(u-64);e=r.length;o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(u=0;u<e;u+=1){o[u>>2]|=r.charCodeAt(u)<<(u%4<<3)}o[u>>2]|=128<<(u%4<<3);if(u>55){a(t,o);for(u=0;u<16;u+=1){o[u]=0}}f=n*8;f=f.toString(16).match(/(.*?)(.{0,8})$/);c=parseInt(f[2],16);h=parseInt(f[1],16)||0;o[14]=c;o[15]=h;a(t,o);return t},s=function(r){var n=r.length,t=[1732584193,-271733879,-1732584194,271733878],u,e,o,f,i,h;for(u=64;u<=n;u+=64){a(t,c(r.subarray(u-64,u)))}r=u-64<n?r.subarray(u-64):new Uint8Array(0);e=r.length;o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(u=0;u<e;u+=1){o[u>>2]|=r[u]<<(u%4<<3)}o[u>>2]|=128<<(u%4<<3);if(u>55){a(t,o);for(u=0;u<16;u+=1){o[u]=0}}f=n*8;f=f.toString(16).match(/(.*?)(.{0,8})$/);i=parseInt(f[2],16);h=parseInt(f[1],16)||0;o[14]=i;o[15]=h;a(t,o);return t},v=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"],d=function(r){var n="",t;for(t=0;t<4;t+=1){n+=v[r>>t*8+4&15]+v[r>>t*8&15]}return n},g=function(r){var n;for(n=0;n<r.length;n+=1){r[n]=d(r[n])}return r.join("")},A=function(r){return g(h(r))};var b=function(){this.reset()};if(A("hello")!=="5d41402abc4b2a76b9719d911017c592"){n=function(r,n){var t=(r&65535)+(n&65535),u=(r>>16)+(n>>16)+(t>>16);return u<<16|t&65535}}b.ArrayBuffer=function(){};b.ArrayBuffer.hash=function(r){return g(s(new Uint8Array(r)))};return b});\n},{}]},{},[1])'],{type:"text/javascript"})));
    md5Worker.addEventListener('message', function(e) {
        var item = workerQueue.shift();
        item.callback(null, e.data);

        nextMd5Task();
    }, false);
}

module.exports = {
    /**
     * Generate a SHA256 HMAC hash from the given data
     *
     * @param  {String} key
     * @param  {String} data
     * @return {String}
     */
    sha256: function(key, data) {
        var shaObj = new Sha('SHA-256', 'TEXT');
        shaObj.setHMACKey(key, 'TEXT');
        shaObj.update(data);
        return shaObj.getHMAC('HEX');
    },

    /**
     * Generate an MD5-sum of the given ArrayBuffer
     *
     * @param  {ArrayBuffer} buffer
     * @param  {Function}    callback
     * @param  {Object}      [options]
     */
    md5: function(buffer, callback, options) {
        if (options && options.type === 'url') {
            readers.getContentsFromUrl(buffer, function(err, data) {
                if (err) {
                    return callback(err);
                }

                module.exports.md5(data, callback, { binary: true });
            });
        } else if (buffer instanceof window.File) {
            readers.getContentsFromFile(buffer, function(err, data) {
                if (err) {
                    return callback(err);
                }

                module.exports.md5(data, callback, { binary: true });
            });
        } else {
            // ArrayBuffer, then.
            process.nextTick(function() {
                addMd5Task(buffer, callback);
            });
        }
    }
};

}).call(this,_dereq_("g5I+bs"))
},{"./md5.min":4,"./readers":6,"./sha":8,"g5I+bs":18}],3:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Check for unsupported features and throw errors if any are found
 *
 * @param {Window|Object} [context]
 */
exports.checkFeatures = function(context) {
    if (typeof window !== 'undefined' || context) {
        var unsupported = exports.getUnsupported(context);
        if (unsupported.length) {
            throw new Error('Browser does not support ' + unsupported.join(', '));
        }
    }
};

/**
 * Returns an array of unsupported features for the browser
 *
 * @param {Window|Object} [context]
 * @return {Array}
 */
exports.getUnsupported = function(context) {
    var global = context || window,
        unsupported = [];

    if (!global.FileReader) {
        unsupported.push('FileReader');
    }

    if (!global.ArrayBuffer) {
        unsupported.push('ArrayBuffer');
    }

    if (!global.XMLHttpRequest) {
        unsupported.push('XMLHttpRequest');
    } else if (!('upload' in new global.XMLHttpRequest())) {
        unsupported.push('XMLHttpRequest2');
    }

    return unsupported;
};

},{}],4:[function(_dereq_,module,exports){
(function(r){module.exports=r()})(function(r){"use strict";var n=function(r,n){return r+n&4294967295},t=function(r,t,u,e,o,f){t=n(n(t,r),n(e,f));return n(t<<o|t>>>32-o,u)},u=function(r,n,u,e,o,f,a){return t(n&u|~n&e,r,n,o,f,a)},e=function(r,n,u,e,o,f,a){return t(n&e|u&~e,r,n,o,f,a)},o=function(r,n,u,e,o,f,a){return t(n^u^e,r,n,o,f,a)},f=function(r,n,u,e,o,f,a){return t(u^(n|~e),r,n,o,f,a)},a=function(r,t){var a=r[0],i=r[1],c=r[2],h=r[3];a=u(a,i,c,h,t[0],7,-680876936);h=u(h,a,i,c,t[1],12,-389564586);c=u(c,h,a,i,t[2],17,606105819);i=u(i,c,h,a,t[3],22,-1044525330);a=u(a,i,c,h,t[4],7,-176418897);h=u(h,a,i,c,t[5],12,1200080426);c=u(c,h,a,i,t[6],17,-1473231341);i=u(i,c,h,a,t[7],22,-45705983);a=u(a,i,c,h,t[8],7,1770035416);h=u(h,a,i,c,t[9],12,-1958414417);c=u(c,h,a,i,t[10],17,-42063);i=u(i,c,h,a,t[11],22,-1990404162);a=u(a,i,c,h,t[12],7,1804603682);h=u(h,a,i,c,t[13],12,-40341101);c=u(c,h,a,i,t[14],17,-1502002290);i=u(i,c,h,a,t[15],22,1236535329);a=e(a,i,c,h,t[1],5,-165796510);h=e(h,a,i,c,t[6],9,-1069501632);c=e(c,h,a,i,t[11],14,643717713);i=e(i,c,h,a,t[0],20,-373897302);a=e(a,i,c,h,t[5],5,-701558691);h=e(h,a,i,c,t[10],9,38016083);c=e(c,h,a,i,t[15],14,-660478335);i=e(i,c,h,a,t[4],20,-405537848);a=e(a,i,c,h,t[9],5,568446438);h=e(h,a,i,c,t[14],9,-1019803690);c=e(c,h,a,i,t[3],14,-187363961);i=e(i,c,h,a,t[8],20,1163531501);a=e(a,i,c,h,t[13],5,-1444681467);h=e(h,a,i,c,t[2],9,-51403784);c=e(c,h,a,i,t[7],14,1735328473);i=e(i,c,h,a,t[12],20,-1926607734);a=o(a,i,c,h,t[5],4,-378558);h=o(h,a,i,c,t[8],11,-2022574463);c=o(c,h,a,i,t[11],16,1839030562);i=o(i,c,h,a,t[14],23,-35309556);a=o(a,i,c,h,t[1],4,-1530992060);h=o(h,a,i,c,t[4],11,1272893353);c=o(c,h,a,i,t[7],16,-155497632);i=o(i,c,h,a,t[10],23,-1094730640);a=o(a,i,c,h,t[13],4,681279174);h=o(h,a,i,c,t[0],11,-358537222);c=o(c,h,a,i,t[3],16,-722521979);i=o(i,c,h,a,t[6],23,76029189);a=o(a,i,c,h,t[9],4,-640364487);h=o(h,a,i,c,t[12],11,-421815835);c=o(c,h,a,i,t[15],16,530742520);i=o(i,c,h,a,t[2],23,-995338651);a=f(a,i,c,h,t[0],6,-198630844);h=f(h,a,i,c,t[7],10,1126891415);c=f(c,h,a,i,t[14],15,-1416354905);i=f(i,c,h,a,t[5],21,-57434055);a=f(a,i,c,h,t[12],6,1700485571);h=f(h,a,i,c,t[3],10,-1894986606);c=f(c,h,a,i,t[10],15,-1051523);i=f(i,c,h,a,t[1],21,-2054922799);a=f(a,i,c,h,t[8],6,1873313359);h=f(h,a,i,c,t[15],10,-30611744);c=f(c,h,a,i,t[6],15,-1560198380);i=f(i,c,h,a,t[13],21,1309151649);a=f(a,i,c,h,t[4],6,-145523070);h=f(h,a,i,c,t[11],10,-1120210379);c=f(c,h,a,i,t[2],15,718787259);i=f(i,c,h,a,t[9],21,-343485551);r[0]=n(a,r[0]);r[1]=n(i,r[1]);r[2]=n(c,r[2]);r[3]=n(h,r[3])},i=function(r){var n=[],t;for(t=0;t<64;t+=4){n[t>>2]=r.charCodeAt(t)+(r.charCodeAt(t+1)<<8)+(r.charCodeAt(t+2)<<16)+(r.charCodeAt(t+3)<<24)}return n},c=function(r){var n=[],t;for(t=0;t<64;t+=4){n[t>>2]=r[t]+(r[t+1]<<8)+(r[t+2]<<16)+(r[t+3]<<24)}return n},h=function(r){var n=r.length,t=[1732584193,-271733879,-1732584194,271733878],u,e,o,f,c,h;for(u=64;u<=n;u+=64){a(t,i(r.substring(u-64,u)))}r=r.substring(u-64);e=r.length;o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(u=0;u<e;u+=1){o[u>>2]|=r.charCodeAt(u)<<(u%4<<3)}o[u>>2]|=128<<(u%4<<3);if(u>55){a(t,o);for(u=0;u<16;u+=1){o[u]=0}}f=n*8;f=f.toString(16).match(/(.*?)(.{0,8})$/);c=parseInt(f[2],16);h=parseInt(f[1],16)||0;o[14]=c;o[15]=h;a(t,o);return t},s=function(r){var n=r.length,t=[1732584193,-271733879,-1732584194,271733878],u,e,o,f,i,h;for(u=64;u<=n;u+=64){a(t,c(r.subarray(u-64,u)))}r=u-64<n?r.subarray(u-64):new Uint8Array(0);e=r.length;o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(u=0;u<e;u+=1){o[u>>2]|=r[u]<<(u%4<<3)}o[u>>2]|=128<<(u%4<<3);if(u>55){a(t,o);for(u=0;u<16;u+=1){o[u]=0}}f=n*8;f=f.toString(16).match(/(.*?)(.{0,8})$/);i=parseInt(f[2],16);h=parseInt(f[1],16)||0;o[14]=i;o[15]=h;a(t,o);return t},v=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"],d=function(r){var n="",t;for(t=0;t<4;t+=1){n+=v[r>>t*8+4&15]+v[r>>t*8&15]}return n},g=function(r){var n;for(n=0;n<r.length;n+=1){r[n]=d(r[n])}return r.join("")},A=function(r){return g(h(r))};var b=function(){this.reset()};if(A("hello")!=="5d41402abc4b2a76b9719d911017c592"){n=function(r,n){var t=(r&65535)+(n&65535),u=(r>>16)+(n>>16)+(t>>16);return u<<16|t&65535}}b.ArrayBuffer=function(){};b.ArrayBuffer.hash=function(r){return g(s(new Uint8Array(r)))};return b});
},{}],5:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Parse a URL into parts
 *
 * @param  {String} url
 * @return {Object}
 */
module.exports = function(url) {
    var link = document.createElement('a');
    link.href = url;

    return {
        protocol: link.protocol,
        host: link.host,
        query: link.search.replace(/^\?/, ''),
        pathname: link.pathname
    };
};

},{}],6:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Get binary contents from a File instance
 *
 * @param  {File}     file
 * @param  {Function} callback
 */
exports.getContentsFromFile = function(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        return callback(null, e.target.result);
    };
    reader.readAsArrayBuffer(file);
};

/**
 * Get binary contents from a URL
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
exports.getContentsFromUrl = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            callback(null, xhr.response || xhr.responseText);
        }
    };
    xhr.send(null);
};

},{}],7:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var extend = _dereq_('../utils/extend');

// Headers which browsers block you from setting
var disallowedHeaders = [
    'User-Agent',
    'Content-Length'
];

/**
 * Normalize a response into a common format for both environments
 *
 * @param  {XMLHttpRequest} xhr
 * @return {Object}
 */
var normalizeResponse = function(xhr) {
    var response = {
        headers: {},
        statusCode: xhr.status
    };

    var headerPairs = xhr.getAllResponseHeaders().split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i],
            index = headerPair.indexOf('\u003a\u0020');

        if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            response.headers[key.toLowerCase()] = val;
        }
    }

    return response;
};

/**
 * Send an HTTP request with the given options
 *
 * @param {Object} options
 */
function request(options) {
    // Prepare options
    var opts = extend({}, options);
    opts.method = opts.method.toUpperCase();
    opts.uri = opts.uri.toString();

    // Instantiate request
    var xhr = new XMLHttpRequest();

    // Request finished handler
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status !== 0 && opts.onComplete) {
            var err = null;
            if (xhr.status >= 400) {
                err = new Error('HTTP ' + xhr.status + ' ' + xhr.statusText);
                err.statusCode = xhr.status;
            }

            opts.onComplete(
                err,
                normalizeResponse(xhr),
                opts.json ? JSON.parse(xhr.responseText) : xhr.responseText
            );
        }
    };

    // Request failure handler
    xhr.onerror = function() {
        opts.onComplete(new Error('XHR error - CORS denied?'), normalizeResponse(xhr));
    };

    // Request progress handler
    if (opts.onProgress) {
        xhr.upload.addEventListener('progress', opts.onProgress, false);
    }

    // Open the request
    xhr.open(opts.method, opts.uri, true);

    // Apply request headers
    for (var key in opts.headers) {
        // We're not allowed to set certain headers in browsers
        if (disallowedHeaders.indexOf(key) > -1) {
            continue;
        }

        xhr.setRequestHeader(key, opts.headers[key]);
    }

    // Is this a JSON-request?
    if (opts.json) {
        xhr.setRequestHeader('Accept', 'application/json');

        // Do we have a payload to deliver as JSON?
        if (typeof opts.json !== 'boolean') {
            xhr.setRequestHeader('Content-Type', 'application/json');
            opts.body = JSON.stringify(opts.json);
        }
    }

    // Send the request
    xhr.send(opts.body);
}

/**
 * Shorthand method for sending requests
 *
 * @param  {String}   method
 * @param  {String}   url
 * @param  {Function} callback
 */
request.short = function(method, url, callback) {
    var options = { method: method, uri: url, onComplete: callback };

    if (method === 'GET') {
        options.json = true;
    }

    request(options);
};

/**
 * Shorthand method for sending GET-requests
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
request.get = function(url, callback) {
    request.short('GET', url, callback);
};

/**
 * Shorthand method for sending DELETE-requests
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
request.del = function(url, callback) {
    request.short('DELETE', url, callback);
};

/**
 * Shorthand method for sending HEAD-requests
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
request.head = function(url, callback) {
    request.short('HEAD', url, callback);
};

module.exports = request;

},{"../utils/extend":15}],8:[function(_dereq_,module,exports){
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

},{}],9:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var ImboUrl = _dereq_('./url/url'),
    ImageUrl = _dereq_('./url/imageurl'),
    ShortUrl = _dereq_('./url/shorturl'),
    ImboQuery = _dereq_('./query'),
    extend = _dereq_('./utils/extend'),
    jsonparse = _dereq_('./utils/jsonparse'),
    crypto = _dereq_('./browser/crypto'),
    request = _dereq_('./browser/request'),
    readers = _dereq_('./browser/readers'),
    features = _dereq_('./browser/feature-support'),
    parseUrls = _dereq_('./utils/parse-urls'),
    get404Handler = _dereq_('./utils/404-handler');

var isBrowser = typeof window !== 'undefined';

/**
 * Constructs a new Imbo client
 *
 * @param {Object} options
 * @param {String} publicKey
 * @param {String} privateKey
 * @throws Will throw an error if there are unsupported features
 */
function ImboClient(options, publicKey, privateKey) {
    // Run a feature check, ensuring all required features are present
    features.checkFeatures();

    // Initialize options
    var opts = this.options = {
        hosts: parseUrls(options.hosts || options),
        publicKey: options.publicKey || publicKey,
        privateKey: options.privateKey || privateKey,
        user: options.user || options.publicKey || publicKey
    };

    // Validate options
    ['publicKey', 'privateKey', 'user'].forEach(function validateOption(opt) {
        if (!opts[opt] || typeof opts[opt] !== 'string') {
            throw new Error('`options.' + opt + '` must be a valid string');
        }
    });
}

extend(ImboClient.prototype, {
    /**
     * Set the user on which commands performed by this client should be performed on
     *
     * @param {String} user
     * @return {ImboClient}
     */
    user: function(user) {
        this.options.user = user;
        return this;
    },

    /**
     * Add a new image to the server from a local file
     *
     * @param {String|File} file     - Path to the local image, or an instance of File
     * @param {Function}    callback - Function to call when image has been uploaded
     * @return {ImboClient}
     */
    addImage: function(file, callback) {
        if (isBrowser && file instanceof window.File) {
            // Browser File instance
            return this.addImageFromBuffer(file, callback);
        }

        // File on filesystem. Note: the reason why we need the size of the file
        // is because of reverse proxies like Varnish which doesn't handle chunked
        // Transfer-Encoding properly - instead we need to explicitly pass the
        // content length so it knows not to terminate the HTTP connection
        readers.getLengthOfFile(file, function(err, fileSize) {
            if (err) {
                return callback(err);
            }

            readers.createReadStream(file).pipe(request({
                method: 'POST',
                uri: this.getSignedResourceUrl('POST', this.getImagesUrl()),
                json: true,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'imboclient-js',
                    'Content-Length': fileSize
                },
                onComplete: function(addErr, res, body) {
                    callback(addErr, body ? body.imageIdentifier : null, body, res);
                }
            }));
        }.bind(this));

        return this;
    },

    /**
     * Add an image from a Buffer, String or File instance
     *
     * @param {Buffer|ArrayBuffer|String|File} source
     * @param {Function} callback
     * @return {ImboClient}
     */
    addImageFromBuffer: function(source, callback) {
        var url = this.getSignedResourceUrl('POST', this.getImagesUrl()),
            isFile = isBrowser && source instanceof window.File,
            onComplete = callback.onComplete || callback,
            onProgress = callback.onProgress || null;

        request({
            method: 'POST',
            uri: url,
            body: source,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'imboclient-js',
                'Content-Length': isFile ? source.size : source.length
            },
            onComplete: function(err, res, body) {
                body = jsonparse(body);
                onComplete(err, body ? body.imageIdentifier : null, body, res);
            },
            onProgress: onProgress
        });

        return this;
    },

    /**
     * Add an image from a remote URL
     *
     * @param {String}   url
     * @param {Function} callback
     * @return {ImboClient}
     */
    addImageFromUrl: function(url, callback) {
        if (isBrowser) {
            // Browser environments can't pipe, so download the file and add it
            return this.getImageDataFromUrl(url, function(err, data) {
                if (err) {
                    return callback(err);
                }

                this.addImageFromBuffer(data, callback);
            }.bind(this));
        }

        // Pipe the source URL into a POST-request
        request({ uri: url }).pipe(request({
            method: 'POST',
            uri: this.getSignedResourceUrl('POST', this.getImagesUrl()),
            json: true,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'imboclient-js'
            },
            onComplete: function(err, res, body) {
                callback(err, body ? body.imageIdentifier : null, body, res);
            }
        }));

        return this;
    },

    /**
     * Get the server statistics
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getServerStats: function(callback) {
        request.get(this.getStatsUrl(), function(err, res, body) {
            callback(err, body, res);
        });

        return this;
    },

    /**
     * Get the server status
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getServerStatus: function(callback) {
        request.get(this.getStatusUrl(), function(err, res, body) {
            if (err) {
                return callback(err);
            }

            body = body || {};
            body.status = res.statusCode;
            body.date = new Date(body.date);

            callback(err, body, res);
        });

        return this;
    },

    /**
     * Fetch the user info of the current user
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getUserInfo: function(callback) {
        request.get(this.getUserUrl(), function(err, res, body) {
            if (body && body.lastModified) {
                body.lastModified = new Date(body.lastModified);
            }

            if (body && !body.user && body.publicKey) {
                body.user = body.publicKey;
            }

            callback(err, body, res);
        });

        return this;
    },

    /**
     * Delete an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteImage: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier, { usePrimaryHost: true }),
            signedUrl = this.getSignedResourceUrl('DELETE', url);

        request.del(signedUrl, callback);
        return this;
    },

    /**
     * Get properties about an image stored in Imbo
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImageProperties: function(imageIdentifier, callback) {
        this.headImage(imageIdentifier, function(err, res) {
            if (err) {
                return callback(err);
            }

            var headers = res.headers,
                prefix = 'x-imbo-original';

            callback(err, {
                width: parseInt(headers[prefix + 'width'], 10),
                height: parseInt(headers[prefix + 'height'], 10),
                filesize: parseInt(headers[prefix + 'filesize'], 10),
                extension: headers[prefix + 'extension'],
                mimetype: headers[prefix + 'mimetype']
            });
        });

        return this;
    },

    /**
     * Edit metadata of an image
     *
     * @param {String}   imageIdentifier
     * @param {Object}   data
     * @param {Function} callback
     * @param {String}   method HTTP method to use (POST/PUT)
     * @return {ImboClient}
     */
    editMetadata: function(imageIdentifier, data, callback, method) {
        var url = this.getMetadataUrl(imageIdentifier);

        request({
            method: method || 'POST',
            uri: this.getSignedResourceUrl(method || 'POST', url),
            json: data,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });

        return this;
    },

    /**
     * Replace metadata of an image
     *
     * @param {String}   imageIdentifier
     * @param {Object}   data
     * @param {Function} callback
     * @return {ImboClient}
     */
    replaceMetadata: function(imageIdentifier, data, callback) {
        return this.editMetadata(imageIdentifier, data, callback, 'PUT');
    },

    /**
     * Get metadata attached to an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    getMetadata: function(imageIdentifier, callback) {
        request.get(this.getMetadataUrl(imageIdentifier), function(err, res, body) {
            callback(err, body, res);
        });

        return this;
    },

    /**
     * Delete all metadata associated with an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteMetadata: function(imageIdentifier, callback) {
        var url = this.getMetadataUrl(imageIdentifier);

        request.del(this.getSignedResourceUrl('DELETE', url), callback);
        return this;
    },

    /**
     * Get a list of images currently stored on the server,
     * and optionally provide a query to filter the results
     *
     * @param {Query|Function} query - A query to use for filtering. If a function
     *                                 is passed, it will be used as the callback
     *                                 and the query will use default settings
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImages: function(query, callback) {
        if (typeof query === 'function' && !callback) {
            callback = query;
            query = null;
        }

        // Fetch the response
        request.get(this.getImagesUrl(query), function(err, res, body) {
            callback(
                err,
                body && body.images,
                body && body.search,
                res
            );
        });

        return this;
    },

    /**
     * Get URL for the status endpoint
     *
     * @return {Imbo.Url}
     */
    getStatusUrl: function() {
        return this.getResourceUrl({ path: '/status' });
    },

    /**
     * Get URL for the stats endpoint
     *
     * @return {Imbo.Url}
     */
    getStatsUrl: function() {
        return this.getResourceUrl({ path: '/stats' });
    },

    /**
     * Get URL for the user endpoint
     *
     * @return {Imbo.Url}
     */
    getUserUrl: function() {
        return this.getResourceUrl({
            path: '/users/' + this.options.user
        });
    },

    /**
     * Get URL for the images endpoint. If the `users` filter is set, the global images endpoint
     * is used instead of the user-specific one (`/images` vs `/user/<user>/images`)
     *
     * @param {Imbo.Query|String} [query]
     * @return {Imbo.Url}
     */
    getImagesUrl: function(query) {
        var url;

        if (query && query.users().length) {
            // When one or more users are specified, use the global images endpoint
            url = this.getResourceUrl({
                path: '/images',
                user: null
            });
        } else {
            url = this.getUserUrl();
            url.setPath(url.getPath() + '/images');
        }

        if (query) {
            url.setQueryString(query.toString());
        }

        return url;
    },

    /**
     * Get URL for the image resource
     *
     * @param  {String} imageIdentifier
     * @param  {Object} [options]
     * @return {Imbo.ImageUrl}
     */
    getImageUrl: function(imageIdentifier, options) {
        if (typeof imageIdentifier !== 'string' || imageIdentifier.length === 0) {
            throw new Error(
                '`imageIdentifier` must be a non-empty string, was "' + imageIdentifier + '"' +
                ' (' + typeof imageIdentifier + ')'
            );
        }

        options = options || {};

        return new ImageUrl({
            baseUrl: this.getHostForImageIdentifier(
                imageIdentifier,
                options.usePrimaryHost
            ),
            path: options.path,
            user: this.options.user,
            publicKey: this.options.publicKey,
            privateKey: this.options.privateKey,
            imageIdentifier: imageIdentifier
        });
    },

    /**
     * Parse a URL-string and return an ImageUrl instance
     *
     * @param  {String} url
     * @param  {String} [privateKey]
     * @return {Imbo.ImageUrl}
     */
    parseImageUrl: function(url, privateKey) {
        return ImageUrl.parse(url, privateKey || this.options.privateKey);
    },

    /**
     * Get URL for the metadata resource
     *
     * @param  {String} imageIdentifier
     * @return {Imbo.ImageUrl}
     */
    getMetadataUrl: function(imageIdentifier) {
        return this.getImageUrl(imageIdentifier, {
            path: '/meta',
            usePrimaryHost: true
        });
    },

    /**
     * Get URL for a resource
     *
     * @param  {Object} options
     * @return {Imbo.Url}
     */
    getResourceUrl: function(options) {
        return new ImboUrl({
            baseUrl: this.options.hosts[0],
            user: typeof options.user !== 'undefined' ? options.user : this.options.user,
            publicKey: this.options.publicKey,
            privateKey: this.options.privateKey,
            queryString: options.query,
            path: options.path
        });
    },

    /**
     * Get the short URL of an image (with optional transformations)
     *
     * @param {Imbo.ImageUrl} imageUrl
     * @param {Function}      callback
     * @return {ImboClient}
     */
    getShortUrl: function(imageUrl, callback) {
        var url = imageUrl.clone(),
            extension = url.getExtension(),
            imageId = url.getImageIdentifier(),
            host = this.getHostForImageIdentifier(imageId);

        var data = {
            imageIdentifier: imageId,
            user: url.getUser(),
            publicKey: url.getPublicKey(),
            query: url.getQueryString()
        };

        if (extension) {
            data.extension = extension;
        }

        // Reset to remove transformations/query string
        url.reset().setPath('/shorturls');

        request({
            method: 'POST',
            uri: this.getSignedResourceUrl('POST', url.toString()),
            json: data,
            onComplete: function(err, res, body) {
                if (err) {
                    return callback(err);
                } else if (!body || !body.id) {
                    return callback('No ShortUrl was returned from server');
                }

                callback(err, new ShortUrl({ baseUrl: host, id: body.id }));
            }
        });

        return this;
    },

    /**
     * Delete all ShortUrls for a given imageIdentifier
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteAllShortUrlsForImage: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier).setPath('/shorturls'),
            signed = this.getSignedResourceUrl('DELETE', url);

        request.del(signed, callback);
        return this;
    },

    /**
     * Delete a ShortUrl for a given imageIdentifier
     *
     * @param {String}               imageIdentifier
     * @param {String|Imbo.ShortUrl} shortUrl
     * @param {Function}             callback
     * @return {ImboClient}
     */
    deleteShortUrlForImage: function(imageIdentifier, shortUrl, callback) {
        var id = shortUrl instanceof ShortUrl ? shortUrl.getId() : shortUrl,
            url = this.getImageUrl(imageIdentifier).setPath('/shorturls/' + id),
            signed = this.getSignedResourceUrl('DELETE', url);

        request.del(signed, callback);
        return this;
    },

    /**
     * Get number of images currently stored for the user
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getNumImages: function(callback) {
        this.getUserInfo(function(err, info) {
            callback(err, info && info.numImages);
        });

        return this;
    },

    /**
     * Checks if a given image exists on the server
     *
     * @param {String}   imgPath
     * @param {Function} callback
     * @return {ImboClient}
     */
    imageExists: function(imgPath, callback) {
        this.getImageChecksum(imgPath, function(err, checksum) {
            if (err) {
                return callback(err);
            }

            this.imageWithChecksumExists(checksum, callback);
        }.bind(this));

        return this;
    },

    /**
     * Checks if a given image identifier exists on the server
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    imageIdentifierExists: function(imageIdentifier, callback) {
        this.headImage(imageIdentifier, get404Handler(callback));

        return this;
    },

    /**
     * Checks if an image with the given MD5-sum exists on the server
     *
     * @param {String}   checksum
     * @param {Function} callback
     * @return {ImboClient}
     */
    imageWithChecksumExists: function(checksum, callback) {
        var query = (new ImboQuery()).originalChecksums([checksum]).limit(1);
        this.getImages(query, function(err, images, search) {
            if (err) {
                return callback(err);
            }

            var exists = search.hits > 0;
            callback(err, exists, exists ? images[0].imageIdentifier : err);
        });

        return this;
    },

    /**
     * Fetch the resource groups available
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getResourceGroups: function(callback) {
        request.get(
            this.getResourceUrl({ path: '/groups', user: null }),
            function onResourceGroupsResponse(err, res, body) {
                callback(
                    err,
                    body && body.groups,
                    body && body.search,
                    res
                );
            }
        );
        return this;
    },

    /**
     * Fetch a specific resource group
     *
     * @param {String} groupName
     * @param {Function} callback
     * @return {ImboClient}
     */
    getResourceGroup: function(groupName, callback) {
        request.get(
            this.getResourceUrl({ path: '/groups/' + groupName, user: null }),
            function onResourceGroupResponse(err, res, body) {
                callback(err, body && body.resources, res);
            }
        );
        return this;
    },

    /**
     * Create a resource group, defining the resources that sohuld be available to it
     *
     * @param {String} groupName
     * @param {Array} resources
     * @param {Function} callback
     * @return {ImboCflient}
     */
    addResourceGroup: function(groupName, resources, callback) {
        this.resourceGroupExists(groupName, function onGroupExistsResponse(err, exists) {
            if (err) {
                return callback(err);
            }

            if (exists) {
                return callback(new Error(
                    'Resource group `' + groupName + '` already exists'
                ));
            }

            this.editResourceGroup(groupName, resources, callback);
        }.bind(this));

        return this;
    },

    /**
     * Create/edit a resource group, setting the resources that should be available to it
     *
     * @param {String} groupName
     * @param {Array} resources
     * @param {Function} callback
     * @return {ImboClient}
     */
    editResourceGroup: function(groupName, resources, callback) {
        var url = this.getResourceUrl({ path: '/groups/' + groupName, user: null });
        request({
            method: 'PUT',
            uri: this.getSignedResourceUrl('PUT', url),
            json: resources,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });

        return this;
    },

    /**
     * Delete the resource group with the given name
     *
     * @param {String} groupName Name of the group you want to delete
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteResourceGroup: function(groupName, callback) {
        var url = this.getResourceUrl({ path: '/groups/' + groupName, user: null });
        request.del(this.getSignedResourceUrl('DELETE', url), callback);

        return this;
    },

    /**
     * Check whether a resource group exists or not
     *
     * @param {String} groupName Name of the group you want to check for the presence of
     * @param {Function} callback
     * @return {ImboClient}
     */
    resourceGroupExists: function(groupName, callback) {
        request.head(
            this.getResourceUrl({ path: '/groups/' + groupName, user: null }),
            get404Handler(callback)
        );
        return this;
    },

    /**
     * Add a public/private key pair
     *
     * @param {String} publicKey Public key you want to add
     * @param {String} privateKey Private key for the public key
     * @param {Function} callback
     * @return {ImboClient}
     */
    addPublicKey: function(publicKey, privateKey, callback) {
        this.publicKeyExists(publicKey, function onPubKeyExistsResponse(err, exists) {
            if (err) {
                return callback(err);
            }

            if (exists) {
                return callback(new Error(
                    'Public key `' + publicKey + '` already exists'
                ));
            }

            this.editPublicKey(publicKey, privateKey, callback);
        }.bind(this));

        return this;
    },

    /**
     * Edit a public/private key pair
     *
     * @param {String} publicKey Public key you want to edit
     * @param {String} privateKey Private key for the public key
     * @param {Function} callback
     * @return {ImboClient}
     */
    editPublicKey: function(publicKey, privateKey, callback) {
        if (!publicKey || !privateKey) {
            throw new Error('Both public key and private key must be specified');
        }

        var url = this.getResourceUrl({ path: '/keys/' + publicKey, user: null });
        request({
            method: 'PUT',
            uri: this.getSignedResourceUrl('PUT', url),
            json: { privateKey: privateKey },
            onComplete: callback
        });

        return this;
    },

    /**
     * Delete a public key
     *
     * @param {String} publicKey Public key you want to delete
     * @param {Function} callback
     * @return {ImboClient}
     */
    deletePublicKey: function(publicKey, callback) {
        var url = this.getResourceUrl({ path: '/keys/' + publicKey, user: null });
        request.del(this.getSignedResourceUrl('DELETE', url), callback);

        return this;
    },

    /**
     * Check whether a public key exists or not
     *
     * @param {String} publicKey Public key you want to check for the presence of
     * @param {Function} callback
     * @return {ImboClient}
     */
    publicKeyExists: function(publicKey, callback) {
        request.head(
            this.getResourceUrl({ path: '/keys/' + publicKey, user: null }),
            get404Handler(callback)
        );
        return this;
    },

    /**
     * Get a list of access control rules for a given public key
     *
     * @param {String} publicKey
     * @param {Function} callback
     * @return {ImboClient}
     */
    getAccessControlRules: function(publicKey, callback) {
        request.get(
            this.getResourceUrl({ path: '/keys/' + publicKey + '/access', user: null }),
            function onAccessControlRulesResponse(err, res, body) {
                callback(err, body, res);
            }
        );
        return this;
    },

    /**
     * Get the details for the access control rule with the given ID
     *
     * @param {String} publicKey
     * @param {String} aclRuleId
     * @param {Function} callback
     * @return {ImboClient}
     */
    getAccessControlRule: function(publicKey, aclRuleId, callback) {
        request.get(
            this.getResourceUrl({
                path: '/keys/' + publicKey + '/access/' + aclRuleId,
                user: null
            }),
            function onAccessControlRulesResponse(err, res, body) {
                callback(err, body, res);
            }
        );
        return this;
    },

    /**
     * Add one or more access control rules to the given public key
     *
     * @param {String} publicKey The public key to add rules to
     * @param {Array} rules Array of access control rules to add
     * @param {Function} callback
     * @return {ImboClient}
     */
    addAccessControlRule: function(publicKey, rules, callback) {
        if (!Array.isArray(rules)) {
            rules = [rules];
        }

        if (!publicKey) {
            throw new Error('Public key must be a valid string');
        }

        var url = this.getResourceUrl({ path: '/keys/' + publicKey + '/access', user: null });

        request({
            method: 'POST',
            uri: this.getSignedResourceUrl('POST', url),
            json: rules,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });

        return this;
    },

    /**
     * Delete the access control rule with the given ID for the given public key
     *
     * @param {String} publicKey
     * @param {String} aclRuleId
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteAccessControlRule: function(publicKey, aclRuleId, callback) {
        var url = this.getResourceUrl({
            path: '/keys/' + publicKey + '/access/' + aclRuleId,
            user: null
        });

        request.del(this.getSignedResourceUrl('DELETE', url), callback);

        return this;
    },

    /**
     * Get the binary data of an image stored on the server
     *
     * @param {String} imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImageData: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier);
        this.getImageDataFromUrl(url, callback);
        return this;
    },

    /**
     * Get the binary data of an image, specified by URL
     *
     * @param {String}   imageUrl
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImageDataFromUrl: function(imageUrl, callback) {
        readers.getContentsFromUrl(imageUrl.toString(), function(err, data) {
            callback(err, err ? null : data);
        });

        return this;
    },

    /**
     * Get a predictable hostname for the given image identifier
     *
     * @param  {String} imageIdentifier
     * @param  {Boolean} [usePrimary=false] Whether to use the primary host
     * @return {String}
     */
    getHostForImageIdentifier: function(imageIdentifier, usePrimary) {
        if (usePrimary) {
            return this.options.hosts[0];
        }

        var dec = imageIdentifier.charCodeAt(imageIdentifier.length - 1);

        // If this is an old image identifier (32 character hex string),
        // maintain backwards compatibility
        if (imageIdentifier.match(/^[a-f0-9]{32}$/)) {
            dec = parseInt(imageIdentifier.substr(0, 2), 16);
        }

        return this.options.hosts[dec % this.options.hosts.length];
    },

    /**
     * Get an MD5 checksum for the given image
     *
     * @param {String|File} image
     * @param {Function}    callback
     * @return {ImboClient}
     */
    getImageChecksum: function(image, callback) {
        crypto.md5(image, callback);
        return this;
    },

    /**
     * Get an MD5 checksum for the given buffer or string
     *
     * @param {Buffer|String} buffer
     * @param {Function}      callback
     * @return {ImboClient}
     */
    getImageChecksumFromBuffer: function(buffer, callback) {
        crypto.md5(buffer, callback, {
            binary: true,
            type: 'string'
        });

        return this;
    },

    /**
     * Generate a signature for the given parameters
     *
     * @param  {String} method
     * @param  {String} url
     * @param  {String} timestamp
     * @return {String}
     */
    generateSignature: function(method, url, timestamp) {
        var data = [method, url, this.options.publicKey, timestamp].join('|'),
            signature = crypto.sha256(this.options.privateKey, data);

        return signature;
    },

    /**
     * Get a signed version of a given URL
     *
     * @param  {String} method - HTTP method
     * @param  {String} url    - Endpoint URL
     * @param  {Date}   [date] - Date to use for signing request
     * @return {String}
     */
    getSignedResourceUrl: function(method, url, date) {
        var timestamp = (date || new Date()).toISOString().replace(/\.\d+Z$/, 'Z'),
            addPubKey = this.options.user !== this.options.publicKey,
            qs = url.toString().indexOf('?') > -1 ? '&' : '?',
            signUrl = addPubKey ? url + qs + 'publicKey=' + this.options.publicKey : url,
            signature = this.generateSignature(method, signUrl.toString(), timestamp);

        qs = addPubKey ? '&' : qs;
        qs += 'signature=' + encodeURIComponent(signature);
        qs += '&timestamp=' + encodeURIComponent(timestamp);

        return signUrl + qs;
    },

    /**
     * Performs an HTTP HEAD requests against the given image identifier
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    headImage: function(imageIdentifier, callback) {
        request.head(
            this.getImageUrl(imageIdentifier, { usePrimaryHost: true }),
            callback
        );

        return this;
    }
});

// Don't blindly depend on this - the API might change at some point, but for
// small extensions to the client where you don't want to explicitly depend on
// the entire request module, this might be an acceptable option
ImboClient.request = request;

module.exports = ImboClient;

},{"./browser/crypto":2,"./browser/feature-support":3,"./browser/readers":6,"./browser/request":7,"./query":10,"./url/imageurl":11,"./url/shorturl":12,"./url/url":13,"./utils/404-handler":14,"./utils/extend":15,"./utils/jsonparse":16,"./utils/parse-urls":17}],10:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var extend = _dereq_('./utils/extend');

/**
 * Constructs a new Imbo image query
 *
 */
var ImboQuery = function() {
    this.values = {};
    this.reset();
};

/**
 * Sort descending
 *
 * @type {String}
 */
ImboQuery.SORT_DESC = 'desc';

/**
 * Sort ascending
 *
 * @type {String}
 */
ImboQuery.SORT_ASC = 'asc';

extend(ImboQuery.prototype, {

    /**
     * Appends a value to the given key
     *
     * @param  {String} key
     * @param  {*}      value
     * @return {Imbo.Query}
     */
    appendValue: function(key, value) {
        this.values[key] = this.values[key].concat(value);
        return this;
    },

    /**
     * Set the value for the given key. If no value is specified, the current value is returned.
     *
     * @param  {String}     key
     * @param  {*}          [value]
     * @return {Imbo.Query}
     */
    setOrGet: function(key, value) {
        if (typeof value === 'undefined') {
            return this.values[key];
        }

        this.values[key] = [].concat(value);
        return this;
    },

    /**
     * Set the IDs to fetch. If no value is specified, the current value is returned.
     *
     * @param  {Array} [ids]
     * @return {Imbo.Query}
     */
    ids: function(ids) {
        return this.setOrGet('ids', ids);
    },

    /**
     * Add an ID to the list of IDs to fetch.
     *
     * @param  {String} id
     * @return {Imbo.Query}
     */
    addId: function(id) {
        return this.appendValue('ids', id);
    },

    /**
     * Adds one or more IDs to the list of existing values.
     *
     * @param  {String|Array} ids
     * @return {Imbo.Query}
     */
    addIds: function(ids) {
        return this.addId(ids);
    },

    /**
     * Set the checksums of the images you want returned. If no value is specified, the current value is returned.
     *
     * @param  {Array} [sums]
     * @return {Imbo.Query}
     */
    checksums: function(sums) {
        return this.setOrGet('checksums', sums);
    },

    /**
     * Adds a checksum to the list of existing values.
     *
     * @param  {String} sum
     * @return {Imbo.Query}
     */
    addChecksum: function(sum) {
        return this.appendValue('checksums', sum);
    },

    /**
     * Adds one or more checksums to the list of existing values.
     *
     * @param  {String|Array} sums
     * @return {Imbo.Query}
     */
    addChecksums: function(sums) {
        return this.addChecksum(sums);
    },

    /**
     * Set the original checksums of the images you want returned.
     * If no value is specified, the current value is returned.
     *
     * @param  {Array} [sums]
     * @return {Imbo.Query}
     */
    originalChecksums: function(sums) {
        return this.setOrGet('originalChecksums', sums);
    },

    /**
     * Adds an original checksum to the list of existing values.
     *
     * @param  {String} sum
     * @return {Imbo.Query}
     */
    addOriginalChecksum: function(sum) {
        return this.appendValue('originalChecksums', sum);
    },

    /**
     * Adds one or more original checksums to the list of existing values.
     *
     * @param  {String|Array} sums
     * @return {Imbo.Query}
     */
    addOriginalChecksums: function(sums) {
        return this.addOriginalChecksum(sums);
    },

    /**
     * Set the fields to return from the images resource. If no value is specified, the current value is returned.
     *
     * @param  {Array} [fields]
     * @return {Imbo.Query}
     */
    fields: function(fields) {
        return this.setOrGet('fields', fields);
    },

    /**
     * Adds a field to the list of current fields to return.
     *
     * @param  {String} field
     * @return {Imbo.Query}
     */
    addField: function(field) {
        return this.appendValue('fields', field);
    },

    /**
     * Adds one or more fields to the list of current fields to return.
     *
     * @param  {String|Array} fields
     * @return {Imbo.Query}
     */
    addFields: function(fields) {
        return this.addField(fields);
    },

    /**
     * Sets the field and direction to sort. If not values are specified, the current value is returned.
     *
     * @param  {String|Array}     [field] - Field to sort on, or an array of sort value
     * @param  {String}           [direction] - Direction to sort ("asc" or "desc")
     * @param  {Boolean}          [append=false] - Whether to append the value or replace the current value
     * @return {Imbo.Query|Array}
     */
    sort: function(field, direction, append) {
        if (Array.isArray(field) || typeof field === 'undefined') {
            return this.setOrGet('sort', field);
        }

        var sort = (direction ? [field, direction] : [field]).join(':');

        if (append) {
            this.values.sort.push(sort);
        } else {
            this.values.sort = [sort];
        }

        return this;
    },

    /**
     * Adds a sort to the current list of sorts.
     *
     * @param  {String} field
     * @param  {String} [direction]
     * @return {Imbo.Query}
     */
    addSort: function(field, direction) {
        return this.sort(field, direction, true);
    },

    /**
     * Adds one or more sorts to the current list of sorts
     *
     * @param  {Array|String} sorts
     * @return {Imbo.Query}
     */
    addSorts: function(sorts) {
        return this.appendValue('sort', sorts);
    },

    /**
     * Set the users of the images you want returned. If no value is specified,
     * the current value is returned.
     *
     * @param  {Array} [users]
     * @return {Imbo.Query}
     */
    users: function(users) {
        return this.setOrGet('users', users);
    },

    /**
     * Adds a user to the list of existing values.
     *
     * @param  {String} user
     * @return {Imbo.Query}
     */
    addUser: function(user) {
        return this.appendValue('users', user);
    },

    /**
     * Adds one or more users to the list of existing values.
     *
     * @param  {String|Array} users
     * @return {Imbo.Query}
     */
    addUsers: function(users) {
        return this.addUser(users);
    },

    /**
     * Sets the page number to fetch. If no value is specified, the current value is returned.
     *
     * @param  {Number} val
     * @return {Imbo.Query}
     */
    page: function(val) {
        if (!val) {
            return this.values.page;
        }

        this.values.page = parseInt(val, 10);
        return this;
    },

    /**
     * Sets the maximum number of items per page. If no value is specified, the current value is returned.
     *
     * @param  {Number} val
     * @return {Imbo.Query}
     */
    limit: function(val) {
        if (!val) {
            return this.values.limit;
        }

        this.values.limit = val;
        return this;
    },

    /**
     * Sets whether to return the metadata associated with the images or not.
     * If no value is specified, the current value is returned.
     *
     * @param  {Boolean} val
     * @return {Imbo.Query}
     */
    metadata: function(val) {
        if (typeof val === 'undefined') {
            return this.values.metadata;
        }

        this.values.metadata = val ? 1 : 0;
        return this;
    },

    /**
     * Sets the earliest upload date of images to return. If no value is specified, the current value is returned.
     *
     * @param  {Date} val
     * @return {Imbo.Query}
     */
    from: function(val) {
        if (!val) {
            return this.values.from;
        }

        this.values.from = val instanceof Date ? val : this.values.from;
        return this;
    },

    /**
     * Sets the latest upload date of images to return. If no value is specified, the current value is returned.
     *
     * @param  {Number} val
     * @return {Imbo.Query}
     */
    to: function(val) {
        if (!val) {
            return this.values.to;
        }

        this.values.to = val instanceof Date ? val : this.values.to;
        return this;
    },

    /**
     * Reset the query to default values
     *
     * @return {Imbo.Query}
     */
    reset: function() {
        var vals = this.values;

        vals.page = 1;
        vals.limit = 20;
        vals.metadata = 0;
        vals.from = null;
        vals.to = null;
        vals.ids = [];
        vals.checksums = [];
        vals.fields = [];
        vals.users = [];
        vals.sort = [];
        vals.originalChecksums = [];

        return this;
    },

    /**
     * Generate a query string from the set parameters
     *
     * @return {String}
     */
    toQueryString: function() {
        // Retrieve query parameters, reduce params down to non-empty values
        var params = {}, key;
        for (key in this.values) {
            if (!Array.isArray(this.values[key]) && this.values[key]) {
                params[key] = this.values[key];
            }
        }

        // Get timestamps from dates
        if (params.from) {
            params.from = Math.floor(params.from.getTime() / 1000);
        }
        if (params.to) {
            params.to = Math.floor(params.to.getTime() / 1000);
        }

        // Build query string
        var parts = [];
        for (key in params) {
            parts.push(key + '=' + params[key]);
        }

        // Get multi-value params
        ['ids', 'checksums', 'originalChecksums', 'fields', 'users', 'sort'].forEach(
            function addMultiValueParams(item) {
                this[item].forEach(function(value) {
                    parts.push(item + '[]=' + value);
                });
            }.bind(this.values)
        );

        return parts.join('&');
    },

    /**
     * Alias of getQueryString()
     *
     * @return {String}
     */
    toString: function() {
        return this.toQueryString();
    }
});

module.exports = ImboQuery;

},{"./utils/extend":15}],11:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */
'use strict';

var ImboUrl = _dereq_('./url'),
    extend = _dereq_('../utils/extend'),
    parseUrl = _dereq_('../browser/parseurl');

// Simple function wrappers for better readability and compression
var toInt = function(num) {
    return parseInt(num, 10);
};

var isNumeric = function(num) {
    return !isNaN(num);
};

var backtickify = function(str) {
    return '`' + str + '`';
};

/**
 * ImageUrl constructor
 *
 * @param {Object} options
 */
var ImageUrl = function(options) {
    this.transformations = options.transformations || [];
    this.rootUrl = options.baseUrl;
    this.baseUrl = options.baseUrl;
    this.user = options.user || options.publicKey;
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
    this.imageIdentifier = options.imageIdentifier;
    this.extension = options.extension;
    this.queryString = options.queryString;
    this.path = options.path || '';

    this.baseUrl += [
        '/users', this.user,
        'images', this.imageIdentifier
    ].join('/');
};

extend(ImageUrl.prototype, ImboUrl.prototype);
extend(ImageUrl.prototype, {
    /**
     * Auto-rotate an image based on EXIF-data
     *
     * @return {Imbo.ImageUrl}
     */
    autoRotate: function() {
        return this.append('autoRotate');
    },

    /**
     * Add a border to the image
     *
     * @param  {Object} [options={}]
     * @param  {String} [options.color=000000]  Color of the border (in hex-format)
     * @param  {Number} [options.width=1]       Width of the left and right borders
     * @param  {Number} [options.height=1]      Height of the top and bottom borders
     * @param  {String} [options.mode=outbound] Mode of the border, "inline" or "outbound"
     * @return {Imbo.ImageUrl}
     */
    border: function(options) {
        options = options || {};

        var params = [
            'color=' + (options.color || '000000').replace(/^#/, ''),
            'width=' + toInt(options.width || 1),
            'height=' + toInt(options.height || 1),
            'mode=' + (options.mode || 'outbound')
        ];

        return this.append('border:' + params.join(','));
    },

    /**
     * Puts the image inside a canvas
     *
     * @param  {Object} options
     * @param  {Number} options.width  Width of the canvas
     * @param  {Number} options.height Height of the canvas
     * @param  {String} [options.mode] Placement mode: "free", "center", "center-x" or "center-y"
     * @param  {Number} [options.x]    X coordinate of the placement of the upper left corner of the existing image
     * @param  {Number} [options.y]    Y coordinate of the placement of the upper left corner of the existing image
     * @param  {String} [options.bg]   Background color of the canvas, in hex-format
     * @return {Imbo.ImageUrl}
     */
    canvas: function(options) {
        options = options || {};

        if (!options.width || !options.height) {
            throw new Error('width and height must be specified');
        }

        var params = [
            'width=' + toInt(options.width),
            'height=' + toInt(options.height)
        ];

        if (options.mode) {
            params.push('mode=' + options.mode);
        }

        if (options.x) {
            params.push('x=' + toInt(options.x));
        }

        if (options.y) {
            params.push('y=' + toInt(options.y));
        }

        if (options.bg) {
            params.push('bg=' + options.bg.replace(/^#/, ''));
        }

        return this.append('canvas:' + params.join(','));
    },

    /**
     * Compress the image
     *
     * @param  {Object} [options={}]
     * @param  {Number} [options.level=75] Compression level (0 - 100)
     * @return {Imbo.ImageUrl}
     */
    compress: function(options) {
        var level = (options || {}).level || options;
        return this.append('compress:level=' + (isNumeric(level) ? level : 75));
    },

    /**
     * Adjust contrast in the image
     *
     * @param  {Object} [options={}]
     * @param  {Number} [options.sharpen] Change in contrast given as number of steps up (positive
     *                                    number) or down (negative number)
     * @return {Imbo.ImageUrl}
     */
    contrast: function(options) {
        var params = [],
            opts = options || {},
            transform = 'contrast';

        if (opts.sharpen) {
            params.push('sharpen=' + opts.sharpen);
        }

        if (params.length) {
            transform += ':' + params.join(',');
        }

        return this.append(transform);
    },

    /**
     * Convert the image to the given file type
     *
     * @param  {String} type File extension ("jpg", "gif", "png")
     * @return {Imbo.ImageUrl}
     */
    convert: function(type) {
        this.extension = type;
        return this;
    },

    /**
     * Crops the image using specified parameters
     *
     * @param  {Object} options
     * @param  {String} [options.mode] Crop mode: "center-x" or "center-y" (available in Imbo >= 1.1.0)
     * @param  {Number} [options.x]    X coordinate of the top left corner of the crop
     * @param  {Number} [options.y]    Y coordinate of the top left corner of the crop
     * @param  {Number} options.width  Width of the crop
     * @param  {Number} options.height Height of the crop
     * @return {Imbo.ImageUrl}
     */
    crop: function(options) {
        var opts = options || {},
            mode = opts.mode,
            x = opts.x,
            y = opts.y,
            width = opts.width,
            height = opts.height;

        if (!mode && (isNaN(x) || isNaN(y))) {
            throw new Error('x and y needs to be specified without a crop mode');
        }

        if (mode === 'center-x' && isNaN(y)) {
            throw new Error('y needs to be specified when mode is center-x');
        } else if (mode === 'center-y' && isNaN(x)) {
            throw new Error('x needs to be specified when mode is center-y');
        } else if (isNaN(width) || isNaN(height)) {
            throw new Error('width and height needs to be specified');
        }

        var params = [
            'width=' + toInt(width),
            'height=' + toInt(height)
        ];

        if (isNumeric(x)) {
            params.push('x=' + toInt(x));
        }

        if (isNumeric(y)) {
            params.push('y=' + toInt(y));
        }

        if (mode) {
            params.push('mode=' + mode);
        }

        return this.append('crop:' + params.join(','));
    },

    /**
     * Desaturate the image
     *
     * @return {Imbo.ImageUrl}
     */
    desaturate: function() {
        return this.append('desaturate');
    },

    /**
     * Flip the image horizontally
     *
     * @return {Imbo.ImageUrl}
     */
    flipHorizontally: function() {
        return this.append('flipHorizontally');
    },

    /**
     * Flip the image vertically
     *
     * @return {Imbo.ImageUrl}
     */
    flipVertically: function() {
        return this.append('flipVertically');
    },

    /**
     * Resize the image to be at most the size specified while still preserving
     * the aspect ratio. If the image is smaller than the given size, the image
     * remains unchanged
     *
     * @param  {Object} options
     * @param  {Number} [options.width]  Max width of the image
     * @param  {Number} [options.height] Max height of the image
     * @return {Imbo.ImageUrl}
     */
    maxSize: function(options) {
        var params = [];

        if (options.width) {
            params.push('width=' + toInt(options.width));
        }

        if (options.height) {
            params.push('height=' + toInt(options.height));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('maxSize:' + params.join(','));
    },

    /**
     * Modulate the image by altering the brightness, saturation and/or hue
     *
     * @param  {Object} options
     * @param  {Number} [options.brightness=100] Brightness level
     * @param  {Number} [options.saturation=100] Saturation level
     * @param  {Number} [options.hue=100]        Hue level
     * @return {Imbo.ImageUrl}
     */
    modulate: function(options) {
        var params = [],
            opts = options || {};

        if (isNumeric(opts.brightness) || isNumeric(opts.b)) {
            params.push('b=' + (opts.brightness || opts.b));
        }

        if (isNumeric(opts.saturation) || isNumeric(opts.s)) {
            params.push('s=' + (opts.saturation || opts.s));
        }

        if (isNumeric(opts.hue) || isNumeric(opts.h)) {
            params.push('h=' + (opts.hue || opts.h));
        }

        if (!params.length) {
            throw new Error('brightness, saturation or hue needs to be specified');
        }

        return this.append('modulate:' + params.join(','));
    },

    /**
     * Set the progressive rendering flag on the image
     *
     * @return {Imbo.ImageUrl}
     */
    progressive: function() {
        return this.append('progressive');
    },

    /**
     * Resize the image to the given size. If only one dimension is specified,
     * the image will be resized while keeping it's aspect ratio
     *
     * @param  {Object} options
     * @param  {Object} [options.width]  New width of the image
     * @param  {Object} [options.height] new height of the image
     * @return {Imbo.ImageUrl}
     */
    resize: function(options) {
        var params = [];

        if (options && options.width) {
            params.push('width=' + toInt(options.width));
        }

        if (options && options.height) {
            params.push('height=' + toInt(options.height));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('resize:' + params.join(','));
    },

    /**
     * Rotate the image by the specified angle
     *
     * @param  {Object} options
     * @param  {Number} options.angle Angle to rotate by
     * @param  {String} [options.bg]  Background color of image, in hex-format
     * @return {Imbo.ImageUrl}
     */
    rotate: function(options) {
        if (!options || isNaN(options.angle)) {
            throw new Error('angle needs to be specified');
        }

        var bg = (options.bg || '000000').replace(/^#/, '');
        return this.append('rotate:angle=' + options.angle + ',bg=' + bg);
    },

    /**
     * Add a sepia effect to the image
     *
     * @param  {Object} [options]
     * @param  {Number} [options.threshold=80] Extent of sepia toning
     * @return {Imbo.ImageUrl}
     */
    sepia: function(options) {
        var threshold = (options || {}).threshold || options;
        return this.append('sepia:threshold=' + (isNumeric(threshold) ? threshold : 80));
    },

    /**
     * Sharpen the image
     *
     * @param  {Object} [options]
     * @param  {String} [options.preset]         Name of a defined preset to use
     * @param  {Number} [options.radius=2]       Radius of the Gaussian operator in pixels
     * @param  {Number} [options.sigma=1]        Standard deviation of the Gaussian, in pixels
     * @param  {Number} [options.gain=1]         Percentage of difference between original and blurred image
     *                                           that is added back into the original
     * @param  {Number} [options.threshold=0.05] Threshold in pixels needed to apply the difference gain
     * @return {Imbo.ImageUrl}
     */
    sharpen: function(options) {
        var params = [],
            opts = options || {},
            transform = 'sharpen';

        if (opts.preset) {
            params.push('preset=' + opts.preset);
        }

        if (typeof opts.radius !== 'undefined') {
            params.push('radius=' + opts.radius);
        }

        if (typeof opts.sigma !== 'undefined') {
            params.push('sigma=' + opts.sigma);
        }

        if (typeof opts.gain !== 'undefined') {
            params.push('gain=' + opts.gain);
        }

        if (typeof opts.threshold !== 'undefined') {
            params.push('threshold=' + opts.threshold);
        }

        if (params.length) {
            transform += ':' + params.join(',');
        }

        return this.append(transform);
    },

    smartSize: function(options) {
        var params = [],
            opts = options || {};

        if (!opts.width || !opts.height) {
            throw new Error('Both width and height needs to be specified');
        }

        if (opts.poi) {
            var poi;
            if (Array.isArray(opts.poi)) {
                poi = opts.poi.map(toInt).join(',');
            } else if (
                typeof opts.poi.x !== 'undefined' &&
                typeof opts.poi.y !== 'undefined') {
                poi = toInt(opts.poi.x) + ',' + toInt(opts.poi.y);
            } else {
                throw new Error(
                    '`poi` parameter must be either an array of [x, y]-coordinates ' +
                    ' or an object with `x` and `y` properties'
                );
            }

            params.push('poi=' + poi);
        }

        if (opts.crop) {
            var cropValues = ['close', 'medium', 'wide'];
            if (cropValues.indexOf(opts.crop) === -1) {
                throw new Error(
                    '`crop` parameter must be either: ' +
                    cropValues.map(backtickify).join(', ')
                );
            }

            params.push('crop=' + opts.crop);
        }

        return this.append('smartSize:' + params.join(','));
    },

    /**
     * Strip the image of all properties and comments (EXIF-data and such)
     *
     * @return {Imbo.ImageUrl}
     */
    strip: function() {
        return this.append('strip');
    },

    /**
     * Create a thumbnailed version of the image
     *
     * @param  {Object} [options]
     * @param  {Number} [options.width=50]     Width of the thumbnail
     * @param  {Number} [options.height=50]    Height of the thumbnail
     * @param  {String} [options.fit=outbound] Fit mode: "outbound" or "inset"
     * @return {Imbo.ImageUrl}
     */
    thumbnail: function(options) {
        options = options || {};

        return this.append([
            'thumbnail:width=' + (options.width || 50),
            'height=' + (options.height || 50),
            'fit=' + (options.fit || 'outbound')
        ].join(','));
    },

    /**
     * Transposes the image
     *
     * @return {Imbo.ImageUrl}
     */
    transpose: function() {
        return this.append('transpose');
    },

    /**
     * Transverse the image
     *
     * @return {Imbo.ImageUrl}
     */
    transverse: function() {
        return this.append('transverse');
    },

    /**
     * Applies a watermark on top of the original image
     *
     * @param  {Object} [options]
     * @param  {Number} [options.img] Image identifier of the image to apply as watermark
     * @param  {Number} [options.width]  Width of the watermark, in pixels
     * @param  {Number} [options.height] Height of the watermark, in pixels
     * @param  {String} [options.position=top-left] Position of the watermark. Values:
     *                                              "top-left", "top-right", "bottom-left", "bottom-right" and "center"
     * @param  {Number} [options.x] Number of pixels in the X-axis the watermark image
     *                              should be offset from the original position
     * @param  {Number} [options.y] Number of pixels in the Y-axis the watermark image
     *                              should be offset from the original position
     * @return {Imbo.ImageUrl}
     */
    watermark: function(options) {
        options = options || {};

        var params = [
            'position=' + (options.position || 'top-left'),
            'x=' + toInt(options.x || 0),
            'y=' + toInt(options.y || 0)
        ];

        if (options.imageIdentifier) {
            params.push('img=' + options.imageIdentifier);
        }

        if (options.width > 0) {
            params.push('width=' + toInt(options.width));
        }

        if (options.height > 0) {
            params.push('height=' + toInt(options.height));
        }

        return this.append('watermark:' + params.join(','));
    },

    /**
     * Specifies the output format as gif
     *
     * @return {Imbo.ImageUrl}
     */
    gif: function() {
        return this.convert('gif');
    },

    /**
     * Specifies the output format as jpg
     *
     * @return {Imbo.ImageUrl}
     */
    jpg: function() {
        return this.convert('jpg');
    },

    /**
     * Specifies the output format as png
     *
     * @return {Imbo.ImageUrl}
     */
    png: function() {
        return this.convert('png');
    },

    /**
     * Reset the image to original state by removing applied transformations
     *
     * @return {Imbo.ImageUrl}
     */
    reset: function() {
        this.extension = null;
        this.queryString = '';
        this.transformations = [];
        return this;
    },

    /**
     * Clone this ImageUrl instance
     *
     * @return {Imbo.ImageUrl}
     */
    clone: function() {
        return new ImageUrl({
            transformations: this.transformations.slice(0),
            baseUrl: this.rootUrl,
            user: this.user,
            publicKey: this.publicKey,
            privateKey: this.privateKey,
            imageIdentifier: this.imageIdentifier,
            extension: this.extension,
            queryString: this.queryString,
            path: this.path
        });
    },

    /**
     * Appends a transformation to the chain
     *
     * @param  {String} transformation A transformation to be applied
     * @return {Imbo.ImageUrl}
     */
    append: function(transformation) {
        this.transformations.push(transformation);
        return this;
    },

    /**
     * Get array of all applied transformations (in the order they were added)
     *
     * @return {Array}
     */
    getTransformations: function() {
        return this.transformations;
    },

    /**
     * Get the specified extension of the image (if any)
     *
     * @return {String}
     */
    getExtension: function() {
        return this.extension;
    },

    /**
     * Return the image identifier for this ImageUrl instance
     *
     * @return {String}
     */
    getImageIdentifier: function() {
        return this.imageIdentifier;
    },

    /**
     * Get the query string with all transformations applied
     *
     * @param  {Boolean} [encode=false]
     * @return {String}
     */
    getQueryString: function(encode) {
        var query = this.queryString || '',
            transformations = this.transformations,
            transformationKey = encode ? 't%5B%5D=' : 't[]=';

        if (encode) {
            transformations = transformations.map(encodeURIComponent);
        }

        if (this.transformations.length) {
            query += query.length ? '&' : '';
            query += transformationKey + transformations.join('&' + transformationKey);
        }

        return query;
    },

    /**
     * Get the base URL for the imageUrl instance
     *
     * @return {String}
     */
    getBaseUrl: function() {
        return this.rootUrl;
    }
});

/**
 * Parse a URL-string and return an ImageUrl instance
 *
 * @param  {String} url
 * @param  {String} [privateKey=null] - Required to generate access tokens
 * @return {Imbo.ImageUrl}
 */
ImageUrl.parse = function(url, privateKey) {
    var parts = parseUrl(url),
        path = parts.pathname,
        basePath = path.replace(/(.*)\/users\/.*/, '$1'),
        user = path.replace(/.*\/users\/(.+?)\/.*/, '$1'),
        query = (parts.query || '').split('&').map(decodeURIComponent),
        publicKey = query.filter(function(item) {
            return item.indexOf('publicKey=') === 0;
        }).map(function(str) {
            return str.substring(10);
        })[0];

    var transformations = query.filter(function(param) {
        return param.indexOf('t[]=') === 0;
    }).map(function(param) {
        return param.substr(4);
    });

    return new ImageUrl({
        baseUrl: parts.protocol + '//' + parts.host + basePath,
        path: path.replace(/.*\/images\/[^\/]*/, ''),
        user: user,
        publicKey: publicKey || user,
        privateKey: privateKey,
        transformations: transformations,
        extension: path.replace(/.*\/images\/.*?(?:\.|$)(.*)/, '$1') || null,
        imageIdentifier: path.replace(/.*\/images\/(.+?)(\..*|$)/, '$1'),
        queryString: query.filter(function(item) {
            return item.indexOf('t[]=') === -1 &&
                item.indexOf('accessToken=') === -1 &&
                item.indexOf('publicKey=') === -1;
        }).join('&')
    });
};

module.exports = ImageUrl;

},{"../browser/parseurl":5,"../utils/extend":15,"./url":13}],12:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */
'use strict';

var extend = _dereq_('../utils/extend');

/**
 * ShortUrl constructor
 *
 * @param {Object} options
 */
var ShortUrl = function(options) {
    this.baseUrl = options.baseUrl;
    this.shortId = options.id;
};

extend(ShortUrl.prototype, {
    /**
     * Get the ID of the short URL
     *
     * @return {String}
     */
    getId: function() {
        return this.shortId;
    },

    /**
     * Get a string representation of the URL
     *
     * @return {String}
     */
    getUrl: function() {
        return this.baseUrl + '/s/' + this.shortId;
    },

    /**
     * Alias of getUrl()
     *
     * @return {String}
     */
    toString: function() {
        return this.getUrl();
    }
});

module.exports = ShortUrl;

},{"../utils/extend":15}],13:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var crypto = _dereq_('../browser/crypto'),
    extend = _dereq_('../utils/extend');

/**
 * ImboUrl constructor
 *
 * @param {Object} options
 */
var ImboUrl = function(options) {
    this.transformations = [];
    this.baseUrl = options.baseUrl;
    this.user = typeof options.user === 'undefined' ? options.publicKey : options.user;
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
    this.extension = options.extension;
    this.imageIdentifier = options.imageIdentifier || '';
    this.path = options.path || '';
    this.queryString = options.queryString;
};

extend(ImboUrl.prototype, {
    /**
     * Get the user for this URL instance
     *
     * @return {String}
     */
    getUser: function() {
        return this.user;
    },

    /**
     * Get the public key for this URL instance
     *
     * @return {String}
     */
    getPublicKey: function() {
        return this.publicKey;
    },

    /**
     * Get the path part of the URL
     *
     * @return {String}
     */
    getPath: function() {
        return this.path;
    },

    /**
     * Set the path part of the URL
     *
     * @param  {String} path
     * @return {Imbo.Url}
     */
    setPath: function(path) {
        this.path = path;
        return this;
    },

    /**
     * Set the private key used to generate access tokens
     *
     * @param  {String} privateKey
     * @return {Imbo.Url}
     */
    setPrivateKey: function(privateKey) {
        this.privateKey = privateKey;
        return this;
    },

    /**
     * Generate access token for the passed URL
     *
     * @param  {String} url
     * @return {String}
     */
    getAccessToken: function(url) {
        return crypto.sha256(this.privateKey, url);
    },

    /**
     * Set the query string for the URL
     *
     * @param  {String} qs
     * @return {Imbo.Url}
     */
    setQueryString: function(qs) {
        this.queryString = qs;
        return this;
    },

    /**
     * Get the query string of the URL
     *
     * @return {String}
     */
    getQueryString: function() {
        return this.queryString || '';
    },

    /**
     * Get a string representation of the URL
     *
     * @return {String}
     */
    getUrl: function() {
        var extension = this.extension ? ('.' + this.extension) : '',
            url = (this.baseUrl + extension + this.path),
            encodedUrl = url,
            addPubKey = this.publicKey !== this.user,
            qs = this.getQueryString();

        if (qs.length) {
            encodedUrl += '?' + this.getQueryString(true);
            url += '?' + qs;
        }

        if (addPubKey) {
            var pubKeyParam = (
                (url.indexOf('?') > -1 ? '&' : '?') +
                'publicKey=' + this.publicKey
            );

            url += pubKeyParam;
            encodedUrl += pubKeyParam;
        }

        return [
            encodedUrl,
            (url.indexOf('?') > -1 ? '&' : '?'),
            'accessToken=' + this.getAccessToken(url, this.privateKey)
        ].join('');
    },

    /**
     * Alias of getUrl()
     *
     * @return {String}
     */
    toString: function() {
        return this.getUrl();
    }
});

module.exports = ImboUrl;

},{"../browser/crypto":2,"../utils/extend":15}],14:[function(_dereq_,module,exports){
'use strict';

function get404Handler(callback) {
    return function(err, res) {
        // If we encounter an error from the server, we might not have
        // statusCode available - in this case, fall back to undefined
        var statusCode = res && res.statusCode ? res.statusCode : null;

        // Request error?
        var reqErr = err && err.statusCode !== 404 ? err : null;

        // Requester returns error on 404, we expect this to happen
        callback(reqErr, statusCode === 200);
    };
}

module.exports = get404Handler;

},{}],15:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Shallow object extend
 *
 * @param {Object} target
 * @param {Object} extension
 * @return {Object} Returns target
 */
module.exports = function(target, extension) {
    for (var key in extension) {
        target[key] = extension[key];
    }

    return target;
};

},{}],16:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Try to parse a string as JSON - on failure, return null
 *
 * @param  {String} str
 * @return {Object|null}
 */
module.exports = function(str) {
    var json;
    try {
        json = JSON.parse(str);
    } catch (e) {
        json = null;
    }

    return json;
};

},{}],17:[function(_dereq_,module,exports){
'use strict';

/**
 * Parse an array of URLs, stripping excessive parts
 *
 * @param  {String|Array} urls
 * @return {Array}
 */
module.exports = function parseUrls(urls) {
    // Accept string for host, if user only specifies one
    if (typeof urls === 'string') {
        urls = [urls];
    } else if (!Array.isArray(urls) || !urls.length) {
        throw new Error('`options.hosts` must be a string or an array of strings');
    }

    // Strip out any unnecessary parts
    var serverUrls = [];
    for (var i = 0; i < urls.length; i++) {
        serverUrls.push(urls[i].replace(/:80(\/|$)/, '$1').replace(/\/$/, ''));
    }

    return serverUrls;
};

},{}],18:[function(_dereq_,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],19:[function(_dereq_,module,exports){
module.exports={
  "name": "imboclient",
  "description": "An Imbo client for node.js and modern browsers",
  "version": "3.1.1",
  "author": "Espen Hovlandsdal <espen@hovlandsdal.com>",
  "contributors": [],
  "repository": {
    "type": "git",
    "url": "http://github.com/imbo/imboclient-js"
  },
  "bugs": {
    "url": "http://github.com/imbo/imboclient-js/issues"
  },
  "dependencies": {
    "request": "^2.60.0"
  },
  "devDependencies": {
    "coveralls": "^2.11.4",
    "del": "^2.0.2",
    "eslint": "^1.6.0",
    "eslint-config-vaffel": "^2.0.0",
    "gulp": "^3.9.0",
    "gulp-browserify": "^0.5.1",
    "gulp-insert": "^0.5.0",
    "gulp-istanbul": "^0.10.1",
    "gulp-mocha": "^2.1.3",
    "gulp-rename": "^1.2.2",
    "gulp-replace": "^0.5.4",
    "gulp-uglify": "^1.4.2",
    "gulp-util": "^3.0.6",
    "nock": "^2.15.0",
    "through": "^2.3.8",
    "workerify": "^0.3.0"
  },
  "scripts": {
    "coveralls": "cat ./coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js",
    "lint": "eslint .",
    "pretest": "npm run lint",
    "test": "gulp test"
  },
  "main": "index",
  "browser": "./dist/browser-bundle.js",
  "engines": {
    "node": ">=0.10.0"
  },
  "license": "MIT"
}

},{}]},{},[1])
(1)
});