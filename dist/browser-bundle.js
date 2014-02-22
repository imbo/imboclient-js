!function(e){if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Imbo=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
exports.Client  = _dereq_('./lib/client');
exports.Url     = _dereq_('./lib/url');
exports.Query   = _dereq_('./lib/query');
exports.Version = _dereq_('./package.json').version;

},{"./lib/client":8,"./lib/query":9,"./lib/url":10,"./package.json":13}],2:[function(_dereq_,module,exports){
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

var supportsWebWorkers = function() {
    if (typeof window.Worker === 'undefined' || typeof window.URL === 'undefined') {
        return false;
    }

    try {
        new Worker(window.URL.createObjectURL(new Blob([''], { type:'text/javascript' })));
    } catch (e) {
        return false;
    }

    return true;
};

var sha     = _dereq_('./sha')
  , md5     = _dereq_('./md5.min')
  , readers = _dereq_('./readers')
  , supportsWorkers = supportsWebWorkers()
  , workerQueue     = []
  , md5Worker;

// Process the next MD5 task in the queue (if any)
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

var addMd5Task = function(buffer, callback) {
    if (supportsWorkers) {
        // We have a worker queue, push an item into it and start processing
        workerQueue.push({ buffer: buffer, callback: callback });
        nextMd5Task();
    } else {
        // We don't have any Web Worker support,
        // queue an MD5 operation on the next tick
        process.nextTick(function() {
            callback(undefined, md5.ArrayBuffer.hash(buffer));
        });
    }
};

if (supportsWorkers) {
    // Set up the actual web worker
    md5Worker = new Worker(window.URL.createObjectURL(new Blob([';(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module \'"+n+"\'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){\n(function(){/* global self */\n\'use strict\';\nvar md5 = require(\'./md5.min\');\nself.onmessage = function(e) {\n    self.postMessage(md5.ArrayBuffer.hash(e.data));\n};\n})()\n},{"./md5.min":2}],2:[function(require,module,exports){\n(function(r){module.exports=r()})(function(r){"use strict";var n=function(r,n){return r+n&4294967295},t=function(r,t,u,e,o,f){t=n(n(t,r),n(e,f));return n(t<<o|t>>>32-o,u)},u=function(r,n,u,e,o,f,a){return t(n&u|~n&e,r,n,o,f,a)},e=function(r,n,u,e,o,f,a){return t(n&e|u&~e,r,n,o,f,a)},o=function(r,n,u,e,o,f,a){return t(n^u^e,r,n,o,f,a)},f=function(r,n,u,e,o,f,a){return t(u^(n|~e),r,n,o,f,a)},a=function(r,t){var a=r[0],i=r[1],c=r[2],h=r[3];a=u(a,i,c,h,t[0],7,-680876936);h=u(h,a,i,c,t[1],12,-389564586);c=u(c,h,a,i,t[2],17,606105819);i=u(i,c,h,a,t[3],22,-1044525330);a=u(a,i,c,h,t[4],7,-176418897);h=u(h,a,i,c,t[5],12,1200080426);c=u(c,h,a,i,t[6],17,-1473231341);i=u(i,c,h,a,t[7],22,-45705983);a=u(a,i,c,h,t[8],7,1770035416);h=u(h,a,i,c,t[9],12,-1958414417);c=u(c,h,a,i,t[10],17,-42063);i=u(i,c,h,a,t[11],22,-1990404162);a=u(a,i,c,h,t[12],7,1804603682);h=u(h,a,i,c,t[13],12,-40341101);c=u(c,h,a,i,t[14],17,-1502002290);i=u(i,c,h,a,t[15],22,1236535329);a=e(a,i,c,h,t[1],5,-165796510);h=e(h,a,i,c,t[6],9,-1069501632);c=e(c,h,a,i,t[11],14,643717713);i=e(i,c,h,a,t[0],20,-373897302);a=e(a,i,c,h,t[5],5,-701558691);h=e(h,a,i,c,t[10],9,38016083);c=e(c,h,a,i,t[15],14,-660478335);i=e(i,c,h,a,t[4],20,-405537848);a=e(a,i,c,h,t[9],5,568446438);h=e(h,a,i,c,t[14],9,-1019803690);c=e(c,h,a,i,t[3],14,-187363961);i=e(i,c,h,a,t[8],20,1163531501);a=e(a,i,c,h,t[13],5,-1444681467);h=e(h,a,i,c,t[2],9,-51403784);c=e(c,h,a,i,t[7],14,1735328473);i=e(i,c,h,a,t[12],20,-1926607734);a=o(a,i,c,h,t[5],4,-378558);h=o(h,a,i,c,t[8],11,-2022574463);c=o(c,h,a,i,t[11],16,1839030562);i=o(i,c,h,a,t[14],23,-35309556);a=o(a,i,c,h,t[1],4,-1530992060);h=o(h,a,i,c,t[4],11,1272893353);c=o(c,h,a,i,t[7],16,-155497632);i=o(i,c,h,a,t[10],23,-1094730640);a=o(a,i,c,h,t[13],4,681279174);h=o(h,a,i,c,t[0],11,-358537222);c=o(c,h,a,i,t[3],16,-722521979);i=o(i,c,h,a,t[6],23,76029189);a=o(a,i,c,h,t[9],4,-640364487);h=o(h,a,i,c,t[12],11,-421815835);c=o(c,h,a,i,t[15],16,530742520);i=o(i,c,h,a,t[2],23,-995338651);a=f(a,i,c,h,t[0],6,-198630844);h=f(h,a,i,c,t[7],10,1126891415);c=f(c,h,a,i,t[14],15,-1416354905);i=f(i,c,h,a,t[5],21,-57434055);a=f(a,i,c,h,t[12],6,1700485571);h=f(h,a,i,c,t[3],10,-1894986606);c=f(c,h,a,i,t[10],15,-1051523);i=f(i,c,h,a,t[1],21,-2054922799);a=f(a,i,c,h,t[8],6,1873313359);h=f(h,a,i,c,t[15],10,-30611744);c=f(c,h,a,i,t[6],15,-1560198380);i=f(i,c,h,a,t[13],21,1309151649);a=f(a,i,c,h,t[4],6,-145523070);h=f(h,a,i,c,t[11],10,-1120210379);c=f(c,h,a,i,t[2],15,718787259);i=f(i,c,h,a,t[9],21,-343485551);r[0]=n(a,r[0]);r[1]=n(i,r[1]);r[2]=n(c,r[2]);r[3]=n(h,r[3])},i=function(r){var n=[],t;for(t=0;t<64;t+=4){n[t>>2]=r.charCodeAt(t)+(r.charCodeAt(t+1)<<8)+(r.charCodeAt(t+2)<<16)+(r.charCodeAt(t+3)<<24)}return n},c=function(r){var n=[],t;for(t=0;t<64;t+=4){n[t>>2]=r[t]+(r[t+1]<<8)+(r[t+2]<<16)+(r[t+3]<<24)}return n},h=function(r){var n=r.length,t=[1732584193,-271733879,-1732584194,271733878],u,e,o,f,c,h;for(u=64;u<=n;u+=64){a(t,i(r.substring(u-64,u)))}r=r.substring(u-64);e=r.length;o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(u=0;u<e;u+=1){o[u>>2]|=r.charCodeAt(u)<<(u%4<<3)}o[u>>2]|=128<<(u%4<<3);if(u>55){a(t,o);for(u=0;u<16;u+=1){o[u]=0}}f=n*8;f=f.toString(16).match(/(.*?)(.{0,8})$/);c=parseInt(f[2],16);h=parseInt(f[1],16)||0;o[14]=c;o[15]=h;a(t,o);return t},s=function(r){var n=r.length,t=[1732584193,-271733879,-1732584194,271733878],u,e,o,f,i,h;for(u=64;u<=n;u+=64){a(t,c(r.subarray(u-64,u)))}r=u-64<n?r.subarray(u-64):new Uint8Array(0);e=r.length;o=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(u=0;u<e;u+=1){o[u>>2]|=r[u]<<(u%4<<3)}o[u>>2]|=128<<(u%4<<3);if(u>55){a(t,o);for(u=0;u<16;u+=1){o[u]=0}}f=n*8;f=f.toString(16).match(/(.*?)(.{0,8})$/);i=parseInt(f[2],16);h=parseInt(f[1],16)||0;o[14]=i;o[15]=h;a(t,o);return t},v=["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"],d=function(r){var n="",t;for(t=0;t<4;t+=1){n+=v[r>>t*8+4&15]+v[r>>t*8&15]}return n},g=function(r){var n;for(n=0;n<r.length;n+=1){r[n]=d(r[n])}return r.join("")},A=function(r){return g(h(r))};var b=function(){this.reset()};if(A("hello")!=="5d41402abc4b2a76b9719d911017c592"){n=function(r,n){var t=(r&65535)+(n&65535),u=(r>>16)+(n>>16)+(t>>16);return u<<16|t&65535}}b.ArrayBuffer=function(){};b.ArrayBuffer.hash=function(r){return g(s(new Uint8Array(r)))};return b});\n},{}]},{},[1])\n;'],{type:"text/javascript"})));
    md5Worker.addEventListener('message', function(e) {
        var item = workerQueue.shift();
        item.callback(undefined, e.data);

        nextMd5Task();
    }, false);
}

module.exports = {
    sha256: function(key, data) {
        return sha.sha256hmac(key, data);
    },

    md5: function(buffer, callback, options) {
        // URL?
        if (options && options.type === 'url') {
            return readers.getContentsFromUrl(buffer, function(err, data) {
                module.exports.md5(data, callback, { binary: true });
            });
        }

        // File instance?
        if (buffer instanceof window.File) {
            return readers.getContentsFromFile(buffer, function(err, data) {
                module.exports.md5(data, callback, { binary: true });
            });
        }

        // ArrayBuffer, then.
        process.nextTick(function() {
            addMd5Task(buffer, callback);
        });
    }
};
}).call(this,_dereq_("/home/espenh/webdev/imboclient-js/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js"))
},{"./md5.min":4,"./readers":5,"./sha":7,"/home/espenh/webdev/imboclient-js/node_modules/grunt-browserify/node_modules/browserify/node_modules/insert-module-globals/node_modules/process/browser.js":12}],3:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

exports.checkFeatures = function(context) {
    if (typeof window !== 'undefined' || context) {
        var unsupported = exports.getUnsupported(context);
        if (unsupported.length) {
            throw new Error('Browser does not support ' + unsupported.join(', '));
        }
    }
};

exports.getUnsupported = function(context) {
    var global = context || window
      , unsupported = [];

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

exports.getContentsFromFile = function(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        return callback(undefined, e.target.result);
    };
    reader.readAsArrayBuffer(file);
};

exports.getContentsFromUrl = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            callback(undefined, xhr.responseText);
        }
    };
    xhr.send(null);
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

var disallowedHeaders = [
    'User-Agent',
    'Content-Length'
];

var normalizeResponse = function(xhr) {
    var res = {
        headers: {},
        statusCode: xhr.status
    };

    var headerPairs = xhr.getAllResponseHeaders().split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i]
          , index      = headerPair.indexOf('\u003a\u0020');

        if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            res.headers[key.toLowerCase()] = val;
        }
    }

    return res;
};

module.exports = function(options) {
    // Prepare options
    options.method = options.method.toUpperCase();
    options.uri    = options.uri.toString();

    // Instantiate request
    var xhr = new XMLHttpRequest();

    // Request finished handler
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status !== 0 && options.onComplete) {
            options.onComplete(
                (xhr.status >= 400) ? (xhr.status + ' ' + xhr.statusText) : undefined,
                normalizeResponse(xhr),
                options.json ? JSON.parse(xhr.responseText) : xhr.responseText
            );
        }
    };

    // Request failure handler
    xhr.onerror = function() {
        options.onComplete('XHR error - CORS denied?', normalizeResponse(xhr));
    };

    // Request progress handler
    if (options.onProgress) {
        xhr.upload.addEventListener('progress', options.onProgress, false);
    }

    // Open the request
    xhr.open(options.method, options.uri, true);

    // Apply request headers
    for (var key in options.headers) {
        // We're not allowed to set certain headers in browsers
        if (disallowedHeaders.indexOf(key) > -1) {
            continue;
        }

        xhr.setRequestHeader(key, options.headers[key]);
    }

    // Is this a JSON-request?
    if (options.json) {
        xhr.setRequestHeader('Accept', 'application/json');

        // Do we have a payload to deliver as JSON?
        if (typeof options.json !== 'boolean') {
            xhr.setRequestHeader('Content-Type', 'application/json');
            options.body = JSON.stringify(options.json);
        }
    }

    // Send the request
    xhr.send(options.body);
};

},{}],7:[function(_dereq_,module,exports){
/**
 * This is based on the following work:
 *
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256,
 * as defined in FIPS 180-2
 *
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 */

/* jshint bitwise: false, newcap: false */
'use strict';

var chrsz = 8;

var safe_add = function(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
    return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
    return (X >>> n);
};

var ch = function(x, y, z) {
    return ((x & y) ^ ((~x) & z));
};

var maj = function(x, y, z) {
    return ((x & y) ^ (x & z) ^ (y & z));
};

var sigma0256 = function(x) {
    return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var sigma1256 = function(x) {
    return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var gamma0256 = function(x) {
    return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var gamma1256 = function (x) {
    return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
    var K = [0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2];
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
                W[j] = safe_add(safe_add(safe_add(gamma1256(W[j - 2]), W[j - 7]), gamma0256(W[j - 15])), W[j - 16]);
            }
            T1 = safe_add(safe_add(safe_add(safe_add(h, sigma1256(e)), ch(e, f, g)), K[j]), W[j]);
            T2 = safe_add(sigma0256(a), maj(a, b, c));

            h = g;
            g = f;
            f = e;
            e = safe_add(d, T1);
            d = c;
            c = b;
            b = a;
            a = safe_add(T1, T2);
        }

        HASH[0] = safe_add(a, HASH[0]);
        HASH[1] = safe_add(b, HASH[1]);
        HASH[2] = safe_add(c, HASH[2]);
        HASH[3] = safe_add(d, HASH[3]);
        HASH[4] = safe_add(e, HASH[4]);
        HASH[5] = safe_add(f, HASH[5]);
        HASH[6] = safe_add(g, HASH[6]);
        HASH[7] = safe_add(h, HASH[7]);
    }

    return HASH;
};

var str2binb = function(str) {
    var bin = Array();
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - i % 32);
    }
    return bin;
};

var binb2hex = function(binarray) {
    var hex_tab = '0123456789abcdef', str = '';
    for (var i = 0; i < binarray.length * 4; i++) {
        str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt((binarray[i>>2] >> ((3 - i % 4) * 8  )) & 0xF);
    }
    return str;
};

var core_hmac_sha256 = function(key, data) {
    var bkey = str2binb(key);
    if (bkey.length > 16) {
        bkey = core_sha256(bkey, key.length * chrsz);
    }

    var ipad = new Array(16), opad = new Array(16);
    for (var i = 0; i < 16; i++) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }

    var hash = core_sha256(ipad.concat(str2binb(data)), 512 + data.length * chrsz);
    return core_sha256(opad.concat(hash), 512 + 256);
};

exports.sha256 = function(string) {
    return binb2hex(core_sha256(string, string.length * chrsz));
};

exports.sha256hmac = function(key, data) {
    return binb2hex(core_hmac_sha256(key, data));
};
},{}],8:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var ImboUrl   = _dereq_('./url'),
    ImboQuery = _dereq_('./query'),
    crypto    = _dereq_('./browser/crypto'),
    request   = _dereq_('./browser/request'),
    readers   = _dereq_('./browser/readers'),
    features  = _dereq_('./browser/feature-support');

var ImboClient = function(serverUrls, publicKey, privateKey) {
    this.options = {
        hosts:      this.parseUrls(serverUrls),
        publicKey:  publicKey,
        privateKey: privateKey
    };

    features.checkFeatures();
};

/**
 * Base/core methods
 */
ImboClient.prototype.getImageChecksum = function(image, callback) {
    return crypto.md5(image, callback);
};

ImboClient.prototype.getImageChecksumFromBuffer = function(string, callback) {
    return crypto.md5(string, callback, {
        binary: true,
        type: 'string'
    });
};

ImboClient.prototype.getImageUrl = function(imageIdentifier) {
    return new ImboUrl({
        baseUrl: this.getHostForImageIdentifier(imageIdentifier),
        publicKey: this.options.publicKey,
        privateKey: this.options.privateKey,
        imageIdentifier: imageIdentifier
    });
};

ImboClient.prototype.getImagesUrl = function(query) {
    return this.getResourceUrl('', '/', query ? query.toString() : null);
};

ImboClient.prototype.getUserUrl = function() {
    return this.getResourceUrl();
};

ImboClient.prototype.getResourceUrl = function(resourceIdentifier, path, query) {
    return new ImboUrl({
        baseUrl: this.options.hosts[0],
        publicKey: this.options.publicKey,
        privateKey: this.options.privateKey,
        imageIdentifier: resourceIdentifier,
        queryString: query,
        path: path
    });
};

ImboClient.prototype.getSignedResourceUrl = function(method, url, date) {
    var timestamp = (date || new Date()).toISOString().replace(/\.\d+Z$/, 'Z'),
        signature = this.generateSignature(method, url.toString(), timestamp),
        qs        = url.toString().indexOf('?') > -1 ? '&' : '?';

    qs += 'signature='  + encodeURIComponent(signature);
    qs += '&timestamp=' + encodeURIComponent(timestamp);

    return url + qs;
};

ImboClient.prototype.generateSignature = function(method, url, timestamp) {
    var data = [method, url, this.options.publicKey, timestamp].join('|'),
        signature = crypto.sha256(this.options.privateKey, data);

    return signature;
};

ImboClient.prototype.getHostForImageIdentifier = function(imageIdentifier) {
    var dec = parseInt(imageIdentifier.slice(0, 2), 16);
    return this.options.hosts[dec % this.options.hosts.length];
};

/**
 * Parse an array of URLs, stripping excessive parts
 *
 * @param  array|string urls
 * @return array
 */
ImboClient.prototype.parseUrls = function(urls) {
    // Accept string for host, if user only specifies one
    if (typeof urls === 'string') {
        urls = [urls];
    }

    // Strip out any unnecessary parts
    var serverUrls = [];
    for (var i = 0; i < urls.length; i++) {
        serverUrls.push(urls[i].replace(/:80(\/|$)/, '$1').replace(/\/$/, ''));
    }

    return serverUrls;
};

/**
 * Image operations
 */
ImboClient.prototype.headImage = function(imageIdentifier, callback) {
    var url = this.getResourceUrl(imageIdentifier);

    request({
        method    : 'HEAD',
        uri       : url,
        onComplete: callback
    });
};

ImboClient.prototype.deleteImage = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier));

    request({
        method: 'DELETE',
        uri   : url,
        onComplete: callback
    });
};

ImboClient.prototype.imageIdentifierExists = function(identifier, callback) {
    this.headImage(identifier, function(err, res) {
        // If we encounter an error from the server, we might not have
        // statusCode available - in this case, fall back to undefined
        var statusCode = res && res.statusCode ? res.statusCode : undefined;

        // Requester returns error on 404, we expect this to happen
        callback(isNaN(err) ? err : undefined, statusCode === 200);
    });
};

ImboClient.prototype.imageExists = function(imgPath, callback) {
    this.getImageChecksum(imgPath, function(err, checksum) {
        if (err) {
            return callback(err);
        }

        this.imageWithChecksumExists(checksum, callback);
    }.bind(this));
};

ImboClient.prototype.imageWithChecksumExists = function(checksum, callback) {
    var query = (new ImboQuery()).originalChecksums([checksum]).limit(1);
    this.getImages(query, function(err, images, search) {
        if (err) {
            return callback(err);
        }

        callback(undefined, search.hits > 0);
    });
};

ImboClient.prototype.addImageFromBuffer = function(source, callback) {
    var url        = this.getSignedResourceUrl('POST', this.getImagesUrl()),
        isFile     = typeof window !== 'undefined' && source instanceof window.File,
        onComplete = callback.onComplete || callback,
        onProgress = callback.onProgress || null;

    request({
        method : 'POST',
        uri    : url,
        body   : source,
        json   : true,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'imboclient-js',
            'Content-Length': isFile ? source.size : source.length
        },
        onComplete: function(err, res, body) {
            onComplete(err, body ? body.imageIdentifier : undefined, res);
        },
        onProgress: onProgress
    });
};

/**
 * Add a new image to the server (from filesystem)
 *
 * @param {string|File}  image    Path to the local image, or an instance of File
 * @param {Function}     callback Function to call when image has been uploaded
 */
ImboClient.prototype.addImage = function(file, callback) {
    if (typeof window !== 'undefined' && file instanceof window.File) {
        // Browser File instance
        return this.addImageFromBuffer(file, callback);
    }

    // File on filesystem. Note: the reason why we need the size of the file
    // is because of Varnish and similar which doesn't handle chunked
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
            onComplete: function(err, res, body) {
                callback(err, body ? body.imageIdentifier : undefined, res);
            }
        }));
    }.bind(this));
};

ImboClient.prototype.addImageFromUrl = function(url, callback) {
    if (typeof window !== 'undefined') {
        // Browser environments can't pipe, so download the file and add it
        return readers.getContentsFromUrl(url, function(err, res, data) {
            if (err) {
                return callback(err);
            }

            this.addImageFromBuffer(data, callback, url);
        }.bind(this));
    }

    // Pipe the source URL into a POST-request
    request({ uri: url }).pipe(request({
        method: 'POST',
        uri: this.getSignedResourceUrl('POST', this.getImagesUrl()),
        json: true,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'imboclient-js'
        },
        onComplete: function(err, res, body) {
            callback(err, body ? body.imageIdentifier : undefined, res);
        }
    }));
};

/**
 * Fetch information for a given user/public key
 */
ImboClient.prototype.getUserInfo = function(callback) {
    request({
        method    : 'GET',
        uri       : this.getUserUrl(),
        json      : true,
        onComplete: function(err, res, body) {
            callback(err, body, res);
        }
    });
};

ImboClient.prototype.getNumImages = function(callback) {
    this.getUserInfo(function(err, info) {
        if (err) {
            return callback(err);
        }

        callback(err, info.numImages);
    });
};

/**
 * Fetch images
 */
ImboClient.prototype.getImages = function(query, callback) {
    if (typeof query === 'function' && !callback) {
        callback = query;
        query = null;
    }

    // Build the complete URL
    var url = this.getImagesUrl(query);

    // Fetch the response
    request({
        method: 'GET',
        uri   : url,
        json  : true,
        onComplete: function(err, res, body) {
            callback(
                err,
                body ? body.images : [],
                body ? body.search : {},
                res
            );
        }
    });
};

/**
 * Metadata methods
 */
ImboClient.prototype.getMetadata = function(imageIdentifier, callback) {
    var url = this.getResourceUrl(imageIdentifier, '/meta');
    request({
        method: 'GET',
        uri   : url,
        json  : true,
        onComplete: function(err, res, body) {
            callback(err, body, res);
        }
    });
};

ImboClient.prototype.deleteMetadata = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl(
        'DELETE',
        this.getResourceUrl(imageIdentifier, '/meta')
    );

    request({
        method    : 'DELETE',
        uri       : url,
        onComplete: callback
    });
};

ImboClient.prototype.editMetadata = function(imageIdentifier, data, callback, method) {
    var url = this.getSignedResourceUrl(
        method || 'POST',
        this.getResourceUrl(imageIdentifier, '/meta')
    );

    request({
        method    : method || 'POST',
        uri       : url,
        json      : data,
        onComplete: function(err, res, body) {
            callback(err, body, res);
        }
    });
};

ImboClient.prototype.replaceMetadata = function(imageIdentifier, data, callback) {
    this.editMetadata(imageIdentifier, data, callback, 'PUT');
};

module.exports = ImboClient;

},{"./browser/crypto":2,"./browser/feature-support":3,"./browser/readers":5,"./browser/request":6,"./query":9,"./url":10}],9:[function(_dereq_,module,exports){
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

var ImboQuery = function() {
    this.values = {
        page     : 1,
        limit    : 20,
        metadata : false,
        from     : null,
        to       : null,

        ids      : [],
        checksums: [],
        fields   : [],
        sort     : [],
        originalChecksums: []
    };
};

ImboQuery.SORT_DESC = 'desc';
ImboQuery.SORT_ASC  = 'asc';

extend(ImboQuery.prototype, {
    appendValue: function(key, value) {
        this.values[key] = this.values[key].concat(value);
        return this;
    },

    setOrGet: function(key, value) {
        if (value === undefined) {
            return this.values[key];
        }

        this.values[key] = [].concat(value);
        return this;
    },

    ids: function(ids) { return this.setOrGet('ids', ids); },
    addId: function(id) { return this.appendValue('ids', id); },
    addIds: function(id) { return this.addId(id); },

    checksums: function(sums) { return this.setOrGet('checksums', sums); },
    addChecksum: function(sum) { return this.appendValue('checksums', sum); },
    addChecksums: function(sums) { return this.addChecksum(sums); },

    originalChecksums: function(sums) { return this.setOrGet('originalChecksums', sums); },
    addOriginalChecksum: function(sum) { return this.appendValue('originalChecksums', sum); },
    addOriginalChecksums: function(sums) { return this.addOriginalChecksum(sums); },

    fields: function(sums) { return this.setOrGet('fields', sums); },
    addField: function(sum) { return this.appendValue('fields', sum); },
    addFields: function(sums) { return this.addField(sums); },

    sort: function(field, direction, append) {
        if (Array.isArray(field) || field === undefined) {
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

    addSort: function(field, direction) {
        return this.sort(field, direction, true);
    },

    addSorts: function(sorts) {
        return this.appendValue('sort', sorts);
    },

    page: function(val) {
        if (!val) { return this.values.page; }
        this.values.page = parseInt(val, 10);
        return this;
    },

    limit: function(val) {
        if (!val) { return this.values.limit; }
        this.values.limit = val;
        return this;
    },

    metadata: function(val) {
        if (typeof val === 'undefined') { return this.values.metadata; }
        this.values.metadata = !!val;
        return this;
    },

    from: function(val) {
        if (!val) { return this.values.from; }
        this.values.from = val instanceof Date ? val : this.values.from;
        return this;
    },

    to: function(val) {
        if (!val) { return this.values.to; }
        this.values.to = val instanceof Date ? val : this.values.to;
        return this;
    },

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
            parts.push(key + '=' + encodeURIComponent(params[key]));
        }

        // Get multi-value params
        ['ids', 'checksums', 'originalChecksums', 'fields', 'sort'].forEach(function(item) {
            this[item].forEach(function(value) {
                parts.push(item + '[]=' + encodeURIComponent(value));
            });
        }.bind(this.values));

        return parts.join('&');
    },

    toString: function() {
        return this.toQueryString();
    }
});

module.exports = ImboQuery;

},{"./utils/extend":11}],10:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var crypto = _dereq_('./browser/crypto'),
    extend = _dereq_('./utils/extend');

/**
 * Imbo URL helper
 */
var ImboUrl = function(options) {
    options = options || {};

    this.transformations = [];
    this.baseUrl = options.baseUrl;
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
    this.imageIdentifier = options.imageIdentifier || '';
    this.path = options.path || '';
    this.queryString = options.queryString;
};

// Simple function wrappers for better readability and compression
var toInt = function(num) { return parseInt(num, 10); },
    isNumeric = function(num) { return !isNaN(num); };

extend(ImboUrl.prototype, {
    autoRotate: function() {
        return this.append('autoRotate');
    },

    border: function(options) {
        options = options || {};

        var params = [
            'color='  + (options.color  || '000000').replace(/^#/, ''),
            'width='  + toInt(options.width  || 1),
            'height=' + toInt(options.height || 1),
            'mode='   + (options.mode   || 'outbound')
        ];

        return this.append('border:' + params.join(','));
    },

    canvas: function(options) {
        options = options || {};

        if (!options.width || !options.height) {
            throw new Error('width and height must be specified');
        }

        var params = [
            'width='  + toInt(options.width),
            'height=' + toInt(options.height),
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

    compress: function(options) {
        var level = (options || {}).level || options;
        return this.append('compress:level=' + (isNumeric(level) ? level : 75));
    },

    convert: function(type) {
        this.imageIdentifier = this.imageIdentifier.substr(0, 32) + '.' + type;
        return this;
    },

    crop: function(options) {
        var opts   = options || {},
            mode   = opts.mode,
            x      = opts.x,
            y      = opts.y,
            width  = opts.width,
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
            'width='  + toInt(width),
            'height=' + toInt(height),
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

    desaturate: function() {
        return this.append('desaturate');
    },

    flipHorizontally: function() {
        return this.append('flipHorizontally');
    },

    flipVertically: function() {
        return this.append('flipVertically');
    },

    maxSize: function(options) {
        var params = [],
            opts   = options || {};

        if (opts.width) {
            params.push('width='  + toInt(opts.width));
        }

        if (opts.height) {
            params.push('height=' + toInt(opts.height));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('maxSize:' + params.join(','));
    },

    modulate: function(options) {
        var params = [],
            opts   = options || {};

        if (isNumeric(opts.brightness)) {
            params.push('b=' + opts.brightness);
        }

        if (isNumeric(opts.saturation)) {
            params.push('s=' + opts.saturation);
        }

        if (isNumeric(opts.hue)) {
            params.push('h=' + opts.hue);
        }

        if (!params.length) {
            throw new Error('brightness, saturation or hue needs to be specified');
        }

        return this.append('modulate:' + params.join(','));
    },

    progressive: function() {
        return this.append('progressive');
    },

    resize: function(options) {
        var params = [],
            opts   = options || {};

        if (opts.width) {
            params.push('width='  + toInt(opts.width));
        }

        if (opts.height) {
            params.push('height=' + toInt(opts.height));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('resize:' + params.join(','));
    },

    rotate: function(options) {
        var opts = options || {};

        if (isNaN(opts.angle)) {
            throw new Error('angle needs to be specified');
        }

        var bg = (opts.bg || '000000').replace(/^#/, '');
        return this.append('rotate:angle=' + opts.angle + ',bg=' + bg);
    },

    sepia: function(options) {
        var threshold = (options || {}).threshold || options;
        return this.append('sepia:threshold=' + (isNumeric(threshold) ? threshold : 80));
    },

    strip: function() {
        return this.append('strip');
    },

    thumbnail: function(options) {
        options = options || {};

        return this.append(
            'thumbnail:width=' + (options.width || 50) +
            ',height=' + (options.height || 50) +
            ',fit=' + (options.fit || 'outbound')
        );
    },

    transpose: function() {
        return this.append('transpose');
    },

    transverse: function() {
        return this.append('transverse');
    },

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

    gif: function() {
        return this.convert('gif');
    },

    jpg: function() {
        return this.convert('jpg');
    },

    png: function() {
        return this.convert('png');
    },

    reset: function() {
        this.imageIdentifier = this.imageIdentifier.substr(0, 32);
        this.transformations = [];
        return this;
    },

    append: function(transformation) {
        this.transformations.push(transformation);
        return this;
    },

    getTransformations: function() {
        return this.transformations;
    },

    getAccessToken: function(url) {
        return crypto.sha256(this.privateKey, url);
    },

    getQueryString: function(encode) {
        var query             = this.queryString || '',
            transformations   = this.transformations,
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

    getUrl: function() {
        var url = this.baseUrl + '/users/' + this.publicKey;
        if (this.imageIdentifier || this.path) {
            url = url + '/images/' + this.imageIdentifier + this.path;
        }

        url = url.replace(/\/+$/, '');

        var encodedUrl = url;
        var qs = this.getQueryString();
        if (qs.length) {
            encodedUrl += '?' + this.getQueryString(true);
            url        += '?' + qs;
        }

        var token = this.getAccessToken(url, this.privateKey);

        return encodedUrl + (url.indexOf('?') > -1 ? '&' : '?') + 'accessToken=' + token;
    },

    toString: function() {
        return this.getUrl();
    }
});

module.exports = ImboUrl;

},{"./browser/crypto":2,"./utils/extend":11}],11:[function(_dereq_,module,exports){
/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

// Shallow object extend
module.exports = function(target, extension) {
    for (var key in extension) {
        target[key] = extension[key];
    }
};

},{}],12:[function(_dereq_,module,exports){
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

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],13:[function(_dereq_,module,exports){
module.exports={
    "name": "imboclient",
    "description": "An Imbo client for node.js and modern browsers",
    "version": "2.2.1",
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
        "request": "~2.34.0"
    },
    "devDependencies": {
        "grunt": "~0.4.2",
        "grunt-browserify": "~2.0.0",
        "grunt-contrib-uglify": "~0.3.2",
        "grunt-contrib-jshint": "~0.8.0",
        "grunt-contrib-watch": "~0.5.3",
        "grunt-mocha-test": "~0.9.0",
        "grunt-mocha-cov": "~0.2.0",
        "grunt-replace": "~0.6.2",
        "through": "~2.3.4",
        "matchdep": "~0.3.0",
        "mocha": "~1.17.1",
        "nock": "~0.27.2",
        "should": "~3.1.2",
        "blanket": "~1.1.6",
        "workerify": "~0.2.3"
    },
    "scripts": {
        "test": "grunt test",
        "blanket": {
            "pattern": "lib",
            "data-cover-never": "node_modules"
        }
    },
    "main": "index",
    "engines": {
        "node": ">=0.10.0"
    },
    "license": "MIT"
}

},{}]},{},[1])
(1)
});