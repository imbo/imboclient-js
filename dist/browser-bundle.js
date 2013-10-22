(function(e){if("function"==typeof bootstrap)bootstrap("imbo",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeImbo=e}else"undefined"!=typeof window?window.Imbo=e():global.Imbo=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.Client  = require('./lib/client');
exports.Url     = require('./lib/url');
exports.Query   = require('./lib/query');
exports.Version = require('./package.json').version;

},{"./lib/client":5,"./lib/query":6,"./lib/url":7,"./package.json":11}],2:[function(require,module,exports){
var hashes  = require('jshashes')
  , readers = require('./readers');

(function(undefined) {
    'use strict';

    module.exports = {
        sha256: function(key, data) {
            var sha256 =  new hashes.SHA256();
            return sha256.hex_hmac(key, data);
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

            // String, then?
            var hasher = new hashes.MD5().setUTF8(!(options && options.binary));
            return setImmediate(callback, undefined, hasher.hex(buffer));
        }
    };

})();

},{"./readers":3,"jshashes":9}],3:[function(require,module,exports){
'use strict';

exports.getContentsFromFile = function(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        return callback(undefined, e.target.result);
    };
    reader.readAsBinaryString(file);
};

exports.getContentsFromUrl = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            callback(undefined, xhr.responseText);
        }
    };
    xhr.send(null);
};

},{}],4:[function(require,module,exports){
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
                (xhr.status >= 400) ? xhr.status : undefined,
                normalizeResponse(xhr),
                options.json ? JSON.parse(xhr.responseText) : xhr.responseText
            );
        }
    };

    // Request failure handler
    xhr.onerror = function(e) {
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
    if (options.json && typeof options.json !== 'boolean') {
        xhr.setRequestHeader('Content-Type', 'application/json');
        options.body = JSON.stringify(options.json);
    }

    // Send the request
    xhr.send(options.body);
};

},{}],5:[function(require,module,exports){
/**
 * Base Imbo client
 */
'use strict';

var ImboUrl = require('./url')
  , crypto  = require('./browser/crypto')
  , request = require('./browser/request')
  , readers = require('./browser/readers')
  , version = require('../package.json').version;

if (typeof window !== 'undefined') {
    // Load setImmediate shim
    require('setimmediate');
}

var ImboClient = function(serverUrls, publicKey, privateKey) {
    this.options = {
        hosts:      this.parseUrls(serverUrls),
        publicKey:  publicKey,
        privateKey: privateKey
    };
};

/**
 * Base/core methods
 */
ImboClient.prototype.getImageIdentifier = function(image, callback) {
    return crypto.md5(image, callback);
};

ImboClient.prototype.getImageIdentifierFromString = function(string, callback) {
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
        path: path,
        query: query
    });
};

ImboClient.prototype.getSignedResourceUrl = function(method, url, date) {
    var timestamp = (date || new Date()).toISOString().replace(/\.\d+Z$/, 'Z');
    var signature = this.generateSignature(method, url.toString(), timestamp);

    var qs = url.toString().indexOf('?') > -1 ? '&' : '?';
    qs += 'signature='  + encodeURIComponent(signature);
    qs += '&timestamp=' + encodeURIComponent(timestamp);

    return url + qs;
};

ImboClient.prototype.generateSignature = function(method, url, timestamp) {
    var data = [method, url, this.options.publicKey, timestamp].join('|');
    var signature = crypto.sha256(this.options.privateKey, data);
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

ImboClient.prototype.deleteImage = function(imgPath, callback) {
    this.getImageIdentifier(imgPath, function(err, imageIdentifier) {
        if (err) {
            return setImmediate(callback, err);
        }

        this.deleteImageByIdentifier(imageIdentifier, callback);
    }.bind(this));
};

ImboClient.prototype.deleteImageByIdentifier = function(imageIdentifier, callback) {
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
    this.getImageIdentifier(imgPath, function(err, imageIdentifier) {
        if (err) {
            return setImmediate(callback, err);
        }

        this.imageIdentifierExists(imageIdentifier, callback);
    }.bind(this));
};

ImboClient.prototype.addImageFromBlob = function(blob, callback, source) {
    this.getImageIdentifierFromString(blob, function(err, imageIdentifier) {
        var url        = this.getSignedResourceUrl('PUT', this.getResourceUrl(imageIdentifier))
          , onComplete = callback.onComplete || callback
          , onProgress = callback.onProgress || null;

        request({
            method : 'PUT',
            uri    : url,
            body   : typeof window !== 'undefined' && source instanceof File ? source : blob,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'imboclient-js ' + version,
                'Content-Length': blob.length
            },
            onComplete: function(err, res) {
                if (err) {
                    return onComplete(err, undefined, res);
                }

                onComplete(undefined, res.headers['x-imbo-imageidentifier'], res);
            },
            onProgress: onProgress
        });
    }.bind(this));
};

/**
 * Add a new image to the server (from filesystem)
 *
 * @param {string|File}  image    Path to the local image, or an instance of File
 * @param {Function}     callback Function to call when image has been uploaded
 */
ImboClient.prototype.addImage = function(image, callback) {
    readers.getContentsFromFile(image, function(err, data) {
        if (err) {
            return callback(err);
        }

        this.addImageFromBlob(data, callback, image);
    }.bind(this));
};

ImboClient.prototype.addImageFromUrl = function(url, callback) {
    readers.getContentsFromUrl(url, function(err, res, data) {
        if (err) {
            return callback(err);
        }

        this.addImageFromBlob(data, callback, url);
    }.bind(this));
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

/**
 * Fetch images
 */
ImboClient.prototype.getImages = function(query, callback) {
    // Build the complete URL
    var url = this.getImagesUrl(query);

    // Fetch the response
    request({
        method: 'GET',
        uri   : url,
        json  : true,
        onComplete: function(err, res, body) {
            callback(err, body, res);
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
        onComplete: callback
    });
};

ImboClient.prototype.replaceMetadata = function(imageIdentifier, data, callback) {
    this.editMetadata(imageIdentifier, data, callback, 'PUT');
};

module.exports = ImboClient;
},{"../package.json":11,"./browser/crypto":2,"./browser/readers":3,"./browser/request":4,"./url":7,"setimmediate":10}],6:[function(require,module,exports){
'use strict';

var ImboQuery = function() {
    this.values = {
        page    : 1,
        limit   : 20,
        metadata: false,
        query   : null,
        from    : null,
        to      : null
    };
};

ImboQuery.prototype.page = function(val) {
    if (!val) { return this.values.page; }
    this.values.page = parseInt(val, 10);
    return this;
};

ImboQuery.prototype.limit = function(val) {
    if (!val) { return this.values.limit; }
    this.values.limit = val;
    return this;
};

ImboQuery.prototype.metadata = function(val) {
    if (typeof val === 'undefined') { return this.values.metadata; }
    this.values.metadata = !!val;
    return this;
};

ImboQuery.prototype.query = function(val) {
    if (!val) { return this.values.query; }
    this.values.query = val;
    return this;
};

ImboQuery.prototype.from = function(val) {
    if (!val) { return this.values.from; }
    this.values.from = val instanceof Date ? val : this.values.from;
    return this;
};

ImboQuery.prototype.to = function(val) {
    if (!val) { return this.values.to; }
    this.values.to = val instanceof Date ? val : this.values.to;
    return this;
};

ImboQuery.prototype.toQueryString = function() {
    // Retrieve query parameters, reduce params down to non-empty values
    var params = {}, keys = ['page', 'limit', 'metadata', 'query', 'from', 'to'];
    for (var i = 0; i < keys.length; i++) {
        if (!!this.values[keys[i]]) {
            params[keys[i]] = this.values[keys[i]];
        }
    }

    // JSON-encode metadata query, if present
    if (params.query) {
        params.query = JSON.stringify(params.query);
    }

    // Get timestamps from dates
    if (params.from) {
        params.from = Math.floor(params.from.getTime() / 1000);
    }
    if (params.to) {
        params.to = Math.floor(params.to.getTime() / 1000);
    }

    // Build query string
    var parts = [], key;
    for (key in params) {
        parts.push(key + '=' + encodeURIComponent(params[key]));
    }
    return parts.join('&');
};

ImboQuery.prototype.toString = ImboQuery.prototype.toQueryString;

module.exports = ImboQuery;

},{}],7:[function(require,module,exports){
'use strict';

var crypto = require('./browser/crypto');

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

ImboUrl.prototype.border = function(color, width, height) {
    color  = (color || '000000').replace(/^#/, '');
    width  = parseInt(isNaN(width)  ? 1 : width,  10);
    height = parseInt(isNaN(height) ? 1 : height, 10);
    return this.append('border:color=' + color + ',width=' + width + ',height=' + height);
};

ImboUrl.prototype.compress = function(quality) {
    quality = parseInt(quality, 10);
    return this.append('compress:quality=' + (quality ? quality : 75));
};

ImboUrl.prototype.convert = function(type) {
    this.imageIdentifier  = this.imageIdentifier.substr(0, 32) + '.' + type;
    return this;
};

ImboUrl.prototype.gif = function() {
    return this.convert('gif');
};

ImboUrl.prototype.jpg = function() {
    return this.convert('jpg');
};

ImboUrl.prototype.png = function() {
    return this.convert('png');
};

ImboUrl.prototype.crop = function(x, y, width, height) {
    return this.append('crop:x=' + x + ',y=' + y + ',width=' + width + ',height=' + height);
};

ImboUrl.prototype.desaturate = function() {
    return this.append('desaturate');
};

ImboUrl.prototype.flipHorizontally = function() {
    return this.append('flipHorizontally');
};

ImboUrl.prototype.flipVertically = function() {
    return this.append('flipVertically');
};

ImboUrl.prototype.maxSize = function(width, height) {
    var params = [];

    if (width) {
        params.push('width='  + parseInt(width,  10));
    }

    if (height) {
        params.push('height=' + parseInt(height, 10));
    }

    return this.append('maxSize:' + params.join(','));
};

ImboUrl.prototype.resize = function(width, height) {
    var params = [];

    if (width) {
        params.push('width='  + parseInt(width,  10));
    }

    if (height) {
        params.push('height=' + parseInt(height, 10));
    }

    return this.append('resize:' + params.join(','));
};

ImboUrl.prototype.rotate = function(angle, bg) {
    if (isNaN(angle)) {
        return this;
    }

    bg = (bg || '000000').replace(/^#/, '');
    return this.append('rotate:angle=' + angle + ',bg=' + bg);
};

ImboUrl.prototype.sepia = function(threshold) {
    threshold = parseInt(threshold, 10);
    return this.append('sepia:threshold=' + (threshold ? threshold : 80));
};

ImboUrl.prototype.thumbnail = function(width, height, fit) {
    return this.append(
        'thumbnail:width=' + (width || 50) +
        ',height=' + (height || 50) +
        ',fit=' + (fit || 'outbound')
    );
};

ImboUrl.prototype.transpose = function() {
    return this.append('transpose');
};

ImboUrl.prototype.transverse = function() {
    return this.append('transverse');
};

ImboUrl.prototype.reset = function() {
    this.imageIdentifier = this.imageIdentifier.substr(0, 32);
    this.transformations = [];
    return this;
};

ImboUrl.prototype.append = function(part) {
    this.transformations.push(encodeURIComponent(part));
    return this;
};

ImboUrl.prototype.getAccessToken = function(url) {
    return crypto.sha256(this.privateKey, url);
};

ImboUrl.prototype.getQueryString = function() {
    var query = this.queryString || '';
    if (this.transformations.length) {
        query += query.length ? '&' : '';
        query += 't[]=' + this.transformations.join('&t[]=');
    }

    return query;
};

ImboUrl.prototype.getUrl = function() {
    var url = this.baseUrl + '/users/' + this.publicKey;
    if (this.imageIdentifier || this.path) {
        url = url + '/images/' + this.imageIdentifier + this.path;
    }

    url = url.replace(/\/+$/, '');

    var qs = this.getQueryString();
    if (qs.length) {
        url += '?' + qs;
    }

    var token = this.getAccessToken(url, this.privateKey);

    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'accessToken=' + token;
};

ImboUrl.prototype.toString = function() {
    return this.getUrl();
};

module.exports = ImboUrl;

},{"./browser/crypto":2}],8:[function(require,module,exports){
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
            if (ev.source === window && ev.data === 'process-tick') {
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

},{}],9:[function(require,module,exports){
var global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};/**
 * jsHashes - A fast and independent hashing library pure JavaScript implemented (ES3 compliant) for both server and client side
 * 
 * @class Hashes
 * @author Tomas Aparicio <tomas@rijndael-project.com>
 * @license New BSD (see LICENSE file)
 * @version 1.0.4
 *
 * Algorithms specification:
 *
 * MD5 <http://www.ietf.org/rfc/rfc1321.txt>
 * RIPEMD-160 <http://homes.esat.kuleuven.be/~bosselae/ripemd160.html>
 * SHA1   <http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf>
 * SHA256 <http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf>
 * SHA512 <http://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf>
 * HMAC <http://www.ietf.org/rfc/rfc2104.txt>
 *
 */
(function(){
  var Hashes;
  
  // private helper methods
  function utf8Encode(str) {
    var  x, y, output = '', i = -1, l;
    
    if (str && str.length) {
      l = str.length;
      while ((i+=1) < l) {
        /* Decode utf-16 surrogate pairs */
        x = str.charCodeAt(i);
        y = i + 1 < l ? str.charCodeAt(i + 1) : 0;
        if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
            x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
            i += 1;
        }
        /* Encode output as utf-8 */
        if (x <= 0x7F) {
            output += String.fromCharCode(x);
        } else if (x <= 0x7FF) {
            output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                        0x80 | ( x & 0x3F));
        } else if (x <= 0xFFFF) {
            output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                        0x80 | ((x >>> 6 ) & 0x3F),
                        0x80 | ( x & 0x3F));
        } else if (x <= 0x1FFFFF) {
            output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                        0x80 | ((x >>> 12) & 0x3F),
                        0x80 | ((x >>> 6 ) & 0x3F),
                        0x80 | ( x & 0x3F));
        }
      }
    }
    return output;
  }
  
  function utf8Decode(str) {
    var i, ac, c1, c2, c3, arr = [], l;
    i = ac = c1 = c2 = c3 = 0;
    
    if (str && str.length) {
      l = str.length;
      str += '';
    
      while (i < l) {
          c1 = str.charCodeAt(i);
          ac += 1;
          if (c1 < 128) {
              arr[ac] = String.fromCharCode(c1);
              i+=1;
          } else if (c1 > 191 && c1 < 224) {
              c2 = str.charCodeAt(i + 1);
              arr[ac] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
              i += 2;
          } else {
              c2 = str.charCodeAt(i + 1);
              c3 = str.charCodeAt(i + 2);
              arr[ac] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
              i += 3;
          }
      }
    }
    return arr.join('');
  }

  /**
   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
   * to work around bugs in some JS interpreters.
   */
  function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF),
        msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }

  /**
   * Bitwise rotate a 32-bit number to the left.
   */
  function bit_rol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }

  /**
   * Convert a raw string to a hex string
   */
  function rstr2hex(input, hexcase) {
    var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef',
        output = '', x, i = 0, l = input.length;
    for (; i < l; i+=1) {
      x = input.charCodeAt(i);
      output += hex_tab.charAt((x >>> 4) & 0x0F) + hex_tab.charAt(x & 0x0F);
    }
    return output;
  }

  /**
   * Convert an array of big-endian words to a string
   */
  function binb2rstr(input) {
    var i, l = input.length * 32, output = '';
    for (i = 0; i < l; i += 8) {
        output += String.fromCharCode((input[i>>5] >>> (24 - i % 32)) & 0xFF);
    }
    return output;
  }

  /**
   * Convert an array of little-endian words to a string
   */
  function binl2rstr(input) {
    var i, l = input.length * 32, output = '';
    for (i = 0;i < l; i += 8) {
      output += String.fromCharCode((input[i>>5] >>> (i % 32)) & 0xFF);
    }
    return output;
  }

  /**
   * Convert a raw string to an array of little-endian words
   * Characters >255 have their high-byte silently ignored.
   */
  function rstr2binl(input) {
    var i, l = input.length * 8, output = Array(input.length >> 2), lo = output.length;
    for (i = 0; i < lo; i+=1) {
      output[i] = 0;
    }
    for (i = 0; i < l; i += 8) {
      output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (i%32);
    }
    return output;
  }
  
  /**
   * Convert a raw string to an array of big-endian words 
   * Characters >255 have their high-byte silently ignored.
   */
   function rstr2binb(input) {
      var i, l = input.length * 8, output = Array(input.length >> 2), lo = output.length;
      for (i = 0; i < lo; i+=1) {
            output[i] = 0;
        }
      for (i = 0; i < l; i += 8) {
            output[i>>5] |= (input.charCodeAt(i / 8) & 0xFF) << (24 - i % 32);
        }
      return output;
   }

  /**
   * Convert a raw string to an arbitrary string encoding
   */
  function rstr2any(input, encoding) {
    var divisor = encoding.length,
        remainders = Array(),
        i, q, x, ld, quotient, dividend, output, full_length;
  
    /* Convert to an array of 16-bit big-endian values, forming the dividend */
    dividend = Array(Math.ceil(input.length / 2));
    ld = dividend.length;
    for (i = 0; i < ld; i+=1) {
      dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
    }
  
    /**
     * Repeatedly perform a long division. The binary array forms the dividend,
     * the length of the encoding is the divisor. Once computed, the quotient
     * forms the dividend for the next step. We stop when the dividend is zerHashes.
     * All remainders are stored for later use.
     */
    while(dividend.length > 0) {
      quotient = Array();
      x = 0;
      for (i = 0; i < dividend.length; i+=1) {
        x = (x << 16) + dividend[i];
        q = Math.floor(x / divisor);
        x -= q * divisor;
        if (quotient.length > 0 || q > 0) {
          quotient[quotient.length] = q;
        }
      }
      remainders[remainders.length] = x;
      dividend = quotient;
    }
  
    /* Convert the remainders to the output string */
    output = '';
    for (i = remainders.length - 1; i >= 0; i--) {
      output += encoding.charAt(remainders[i]);
    }
  
    /* Append leading zero equivalents */
    full_length = Math.ceil(input.length * 8 / (Math.log(encoding.length) / Math.log(2)));
    for (i = output.length; i < full_length; i+=1) {
      output = encoding[0] + output;
    }
    return output;
  }

  /**
   * Convert a raw string to a base-64 string
   */
  function rstr2b64(input, b64pad) {
    var tab = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        output = '',
        len = input.length, i, j, triplet;
    b64pad= b64pad || '=';
    for (i = 0; i < len; i += 3) {
      triplet = (input.charCodeAt(i) << 16)
            | (i + 1 < len ? input.charCodeAt(i+1) << 8 : 0)
            | (i + 2 < len ? input.charCodeAt(i+2)      : 0);
      for (j = 0; j < 4; j+=1) {
        if (i * 8 + j * 6 > input.length * 8) { 
          output += b64pad; 
        } else { 
          output += tab.charAt((triplet >>> 6*(3-j)) & 0x3F); 
        }
       }
    }
    return output;
  }

  Hashes = {
  /**  
   * @property {String} version
   * @readonly
   */
  VERSION : '1.0.3',

  
  /**
   * @member Hashes
   * @class MD5
   * @constructor
   * @param {Object} [config]
   * 
   * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
   * Digest Algorithm, as defined in RFC 1321.
   * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
   * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
   * See <http://pajhome.org.uk/crypt/md5> for more infHashes.
   */
  MD5 : function (options) {  
    /**
     * Private config properties. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     * See {@link Hashes.MD5#method-setUpperCase} and {@link Hashes.SHA1#method-setUpperCase}
     */
    var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase
        b64pad = (options && typeof options.pad === 'string') ? options.pda : '=', // base-64 pad character. Defaults to '=' for strict RFC compliance
        utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true; // enable/disable utf8 encoding

    // privileged (public) methods 
    this.hex = function (s) { 
      return rstr2hex(rstr(s, utf8), hexcase);
    };
    this.b64 = function (s) { 
      return rstr2b64(rstr(s), b64pad);
    };
    this.any = function(s, e) { 
      return rstr2any(rstr(s, utf8), e); 
    };
    this.hex_hmac = function (k, d) { 
      return rstr2hex(rstr_hmac(k, d), hexcase); 
    };
    this.b64_hmac = function (k, d) { 
      return rstr2b64(rstr_hmac(k,d), b64pad); 
    };
    this.any_hmac = function (k, d, e) { 
      return rstr2any(rstr_hmac(k, d), e); 
    };
    /**
     * Perform a simple self-test to see if the VM is working
     * @return {String} Hexadecimal hash sample
     */
    this.vm_test = function () {
      return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
    };
    /** 
     * Enable/disable uppercase hexadecimal returned string 
     * @param {Boolean} 
     * @return {Object} this
     */ 
    this.setUpperCase = function (a) {
      if (typeof a === 'boolean' ) {
        hexcase = a;
      }
      return this;
    };
    /** 
     * Defines a base64 pad string 
     * @param {String} Pad
     * @return {Object} this
     */ 
    this.setPad = function (a) {
      b64pad = a || b64pad;
      return this;
    };
    /** 
     * Defines a base64 pad string 
     * @param {Boolean} 
     * @return {Object} [this]
     */ 
    this.setUTF8 = function (a) {
      if (typeof a === 'boolean') { 
        utf8 = a;
      }
      return this;
    };

    // private methods

    /**
     * Calculate the MD5 of a raw string
     */
    function rstr(s) {
      s = (utf8) ? utf8Encode(s): s;
      return binl2rstr(binl(rstr2binl(s), s.length * 8));
    }
    
    /**
     * Calculate the HMAC-MD5, of a key and some data (raw strings)
     */
    function rstr_hmac(key, data) {
      var bkey, ipad, opad, hash, i;

      key = (utf8) ? utf8Encode(key) : key;
      data = (utf8) ? utf8Encode(data) : data;
      bkey = rstr2binl(key);
      if (bkey.length > 16) { 
        bkey = binl(bkey, key.length * 8); 
      }

      ipad = Array(16), opad = Array(16); 
      for (i = 0; i < 16; i+=1) {
          ipad[i] = bkey[i] ^ 0x36363636;
          opad[i] = bkey[i] ^ 0x5C5C5C5C;
      }
      hash = binl(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
      return binl2rstr(binl(opad.concat(hash), 512 + 128));
    }

    /**
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     */
    function binl(x, len) {
      var i, olda, oldb, oldc, oldd,
          a =  1732584193,
          b = -271733879,
          c = -1732584194,
          d =  271733878;
        
      /* append padding */
      x[len >> 5] |= 0x80 << ((len) % 32);
      x[(((len + 64) >>> 9) << 4) + 14] = len;

      for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;

        a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
        d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
        c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
        b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
        a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
        d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
        c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
        b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
        a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
        d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
        c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
        b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
        a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
        d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
        c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
        b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

        a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
        d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
        c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
        b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
        a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
        d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
        c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
        b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
        a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
        d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
        c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
        b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
        a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
        d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
        c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
        b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

        a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
        d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
        c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
        b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
        a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
        d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
        c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
        b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
        a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
        d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
        c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
        b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
        a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
        d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
        c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
        b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

        a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
        d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
        c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
        b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
        a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
        d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
        c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
        b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
        a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
        d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
        c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
        b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
        a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
        d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
        c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
        b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

        a = safe_add(a, olda);
        b = safe_add(b, oldb);
        c = safe_add(c, oldc);
        d = safe_add(d, oldd);
      }
      return Array(a, b, c, d);
    }

    /**
     * These functions implement the four basic operations the algorithm uses.
     */
    function md5_cmn(q, a, b, x, s, t) {
      return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
      return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
      return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
      return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
      return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }
  },
  
  /**
   * @class Hashes.SHA256
   * @param {config}
   * 
   * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined in FIPS 180-2
   * Version 2.2 Copyright Angel Marin, Paul Johnston 2000 - 2009.
   * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
   * See http://pajhome.org.uk/crypt/md5 for details.
   * Also http://anmar.eu.org/projects/jssha2/
   */
  SHA256 : function (options) {
    /**
     * Private properties configuration variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     * @see this.setUpperCase() method
     * @see this.setPad() method
     */
    var hexcase = (options && typeof options.uppercase === 'boolean') ? options.uppercase : false, // hexadecimal output case format. false - lowercase; true - uppercase  */
              b64pad = (options && typeof options.pad === 'string') ? options.pda : '=', /* base-64 pad character. Default '=' for strict RFC compliance   */
              utf8 = (options && typeof options.utf8 === 'boolean') ? options.utf8 : true, /* enable/disable utf8 encoding */
              sha256_K;

    /* privileged (public) methods */
    this.hex = function (s) { 
      return rstr2hex(rstr(s, utf8)); 
    };
    this.b64 = function (s) { 
      return rstr2b64(rstr(s, utf8), b64pad);
    };
    this.any = function (s, e) { 
      return rstr2any(rstr(s, utf8), e); 
    };
    this.hex_hmac = function (k, d) { 
      return rstr2hex(rstr_hmac(k, d)); 
    };
    this.b64_hmac = function (k, d) { 
      return rstr2b64(rstr_hmac(k, d), b64pad);
    };
    this.any_hmac = function (k, d, e) { 
      return rstr2any(rstr_hmac(k, d), e); 
    };
    /**
     * Perform a simple self-test to see if the VM is working
     * @return {String} Hexadecimal hash sample
     * @public
     */
    this.vm_test = function () {
      return hex('abc').toLowerCase() === '900150983cd24fb0d6963f7d28e17f72';
    };
    /** 
     * Enable/disable uppercase hexadecimal returned string 
     * @param {boolean} 
     * @return {Object} this
     * @public
     */ 
    this.setUpperCase = function (a) {
      if (typeof a === 'boolean') { 
        hexcase = a;
      }
      return this;
    };
    /** 
     * @description Defines a base64 pad string 
     * @param {string} Pad
     * @return {Object} this
     * @public
     */ 
    this.setPad = function (a) {
      b64pad = a || b64pad;
      return this;
    };
    /** 
     * Defines a base64 pad string 
     * @param {boolean} 
     * @return {Object} this
     * @public
     */ 
    this.setUTF8 = function (a) {
      if (typeof a === 'boolean') {
        utf8 = a;
      }
      return this;
    };
    
    // private methods

    /**
     * Calculate the SHA-512 of a raw string
     */
    function rstr(s, utf8) {
      s = (utf8) ? utf8Encode(s) : s;
      return binb2rstr(binb(rstr2binb(s), s.length * 8));
    }

    /**
     * Calculate the HMAC-sha256 of a key and some data (raw strings)
     */
    function rstr_hmac(key, data) {
      key = (utf8) ? utf8Encode(key) : key;
      data = (utf8) ? utf8Encode(data) : data;
      var hash, i = 0,
          bkey = rstr2binb(key), 
          ipad = Array(16), 
          opad = Array(16);

      if (bkey.length > 16) { bkey = binb(bkey, key.length * 8); }
      
      for (; i < 16; i+=1) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
      }
      
      hash = binb(ipad.concat(rstr2binb(data)), 512 + data.length * 8);
      return binb2rstr(binb(opad.concat(hash), 512 + 256));
    }
    
    /*
     * Main sha256 function, with its support functions
     */
    function sha256_S (X, n) {return ( X >>> n ) | (X << (32 - n));}
    function sha256_R (X, n) {return ( X >>> n );}
    function sha256_Ch(x, y, z) {return ((x & y) ^ ((~x) & z));}
    function sha256_Maj(x, y, z) {return ((x & y) ^ (x & z) ^ (y & z));}
    function sha256_Sigma0256(x) {return (sha256_S(x, 2) ^ sha256_S(x, 13) ^ sha256_S(x, 22));}
    function sha256_Sigma1256(x) {return (sha256_S(x, 6) ^ sha256_S(x, 11) ^ sha256_S(x, 25));}
    function sha256_Gamma0256(x) {return (sha256_S(x, 7) ^ sha256_S(x, 18) ^ sha256_R(x, 3));}
    function sha256_Gamma1256(x) {return (sha256_S(x, 17) ^ sha256_S(x, 19) ^ sha256_R(x, 10));}
    function sha256_Sigma0512(x) {return (sha256_S(x, 28) ^ sha256_S(x, 34) ^ sha256_S(x, 39));}
    function sha256_Sigma1512(x) {return (sha256_S(x, 14) ^ sha256_S(x, 18) ^ sha256_S(x, 41));}
    function sha256_Gamma0512(x) {return (sha256_S(x, 1)  ^ sha256_S(x, 8) ^ sha256_R(x, 7));}
    function sha256_Gamma1512(x) {return (sha256_S(x, 19) ^ sha256_S(x, 61) ^ sha256_R(x, 6));}
    
    sha256_K = [
      1116352408, 1899447441, -1245643825, -373957723, 961987163, 1508970993,
      -1841331548, -1424204075, -670586216, 310598401, 607225278, 1426881987,
      1925078388, -2132889090, -1680079193, -1046744716, -459576895, -272742522,
      264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
      -1740746414, -1473132947, -1341970488, -1084653625, -958395405, -710438585,
      113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291,
      1695183700, 1986661051, -2117940946, -1838011259, -1564481375, -1474664885,
      -1035236496, -949202525, -778901479, -694614492, -200395387, 275423344,
      430227734, 506948616, 659060556, 883997877, 958139571, 1322822218,
      1537002063, 1747873779, 1955562222, 2024104815, -2067236844, -1933114872,
      -1866530822, -1538233109, -1090935817, -965641998
    ];
    
    function binb(m, l) {
      var HASH = [1779033703, -1150833019, 1013904242, -1521486534,
                 1359893119, -1694144372, 528734635, 1541459225];
      var W = new Array(64);
      var a, b, c, d, e, f, g, h;
      var i, j, T1, T2;
    
      /* append padding */
      m[l >> 5] |= 0x80 << (24 - l % 32);
      m[((l + 64 >> 9) << 4) + 15] = l;
    
      for (i = 0; i < m.length; i += 16)
      {
      a = HASH[0];
      b = HASH[1];
      c = HASH[2];
      d = HASH[3];
      e = HASH[4];
      f = HASH[5];
      g = HASH[6];
      h = HASH[7];
    
      for (j = 0; j < 64; j+=1)
      {
        if (j < 16) { 
          W[j] = m[j + i];
        } else { 
          W[j] = safe_add(safe_add(safe_add(sha256_Gamma1256(W[j - 2]), W[j - 7]),
                          sha256_Gamma0256(W[j - 15])), W[j - 16]);
        }
    
        T1 = safe_add(safe_add(safe_add(safe_add(h, sha256_Sigma1256(e)), sha256_Ch(e, f, g)),
                                  sha256_K[j]), W[j]);
        T2 = safe_add(sha256_Sigma0256(a), sha256_Maj(a, b, c));
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
    }

  }
};

  // exposes Hashes
  (function( window, undefined ) {
    var freeExports = false;
    if (typeof exports === 'object' ) {
      freeExports = exports;
      if (exports && typeof global === 'object' && global && global === global.global ) { window = global; }
    }

    if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
      // define as an anonymous module, so, through path mapping, it can be aliased
      define(function () { return Hashes; });
    }
    else if ( freeExports ) {
      // in Node.js or RingoJS v0.8.0+
      if ( typeof module === 'object' && module && module.exports === freeExports ) {
        module.exports = Hashes;
      }
      // in Narwhal or RingoJS v0.7.0-
      else {
        freeExports.Hashes = Hashes;
      }
    }
    else {
      // in a browser or Rhino
      window.Hashes = Hashes;
    }
  }( this ));
}()); // IIFE

},{}],10:[function(require,module,exports){
var process=require("__browserify_process"),global=typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};(function (global, undefined) {
    "use strict";

    var tasks = (function () {
        function Task(handler, args) {
            this.handler = handler;
            this.args = args;
        }
        Task.prototype.run = function () {
            // See steps in section 5 of the spec.
            if (typeof this.handler === "function") {
                // Choice of `thisArg` is not in the setImmediate spec; `undefined` is in the setTimeout spec though:
                // http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html
                this.handler.apply(undefined, this.args);
            } else {
                var scriptSource = "" + this.handler;
                /*jshint evil: true */
                eval(scriptSource);
            }
        };

        var nextHandle = 1; // Spec says greater than zero
        var tasksByHandle = {};
        var currentlyRunningATask = false;

        return {
            addFromSetImmediateArguments: function (args) {
                var handler = args[0];
                var argsToHandle = Array.prototype.slice.call(args, 1);
                var task = new Task(handler, argsToHandle);

                var thisHandle = nextHandle++;
                tasksByHandle[thisHandle] = task;
                return thisHandle;
            },
            runIfPresent: function (handle) {
                // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
                // So if we're currently running a task, we'll need to delay this invocation.
                if (!currentlyRunningATask) {
                    var task = tasksByHandle[handle];
                    if (task) {
                        currentlyRunningATask = true;
                        try {
                            task.run();
                        } finally {
                            delete tasksByHandle[handle];
                            currentlyRunningATask = false;
                        }
                    }
                } else {
                    // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
                    // "too much recursion" error.
                    global.setTimeout(function () {
                        tasks.runIfPresent(handle);
                    }, 0);
                }
            },
            remove: function (handle) {
                delete tasksByHandle[handle];
            }
        };
    }());

    function canUseNextTick() {
        // Don't get fooled by e.g. browserify environments.
        return typeof process === "object" &&
               Object.prototype.toString.call(process) === "[object process]";
    }

    function canUseMessageChannel() {
        return !!global.MessageChannel;
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.

        if (!global.postMessage || global.importScripts) {
            return false;
        }

        var postMessageIsAsynchronous = true;
        var oldOnMessage = global.onmessage;
        global.onmessage = function () {
            postMessageIsAsynchronous = false;
        };
        global.postMessage("", "*");
        global.onmessage = oldOnMessage;

        return postMessageIsAsynchronous;
    }

    function canUseReadyStateChange() {
        return "document" in global && "onreadystatechange" in global.document.createElement("script");
    }

    function installNextTickImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            process.nextTick(function () {
                tasks.runIfPresent(handle);
            });

            return handle;
        };
    }

    function installMessageChannelImplementation(attachTo) {
        var channel = new global.MessageChannel();
        channel.port1.onmessage = function (event) {
            var handle = event.data;
            tasks.runIfPresent(handle);
        };
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            channel.port2.postMessage(handle);

            return handle;
        };
    }

    function installPostMessageImplementation(attachTo) {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var MESSAGE_PREFIX = "com.bn.NobleJS.setImmediate" + Math.random();

        function isStringAndStartsWith(string, putativeStart) {
            return typeof string === "string" && string.substring(0, putativeStart.length) === putativeStart;
        }

        function onGlobalMessage(event) {
            // This will catch all incoming messages (even from other windows!), so we need to try reasonably hard to
            // avoid letting anyone else trick us into firing off. We test the origin is still this window, and that a
            // (randomly generated) unpredictable identifying prefix is present.
            if (event.source === global && isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
                var handle = event.data.substring(MESSAGE_PREFIX.length);
                tasks.runIfPresent(handle);
            }
        }
        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
            // invoking our onGlobalMessage listener above.
            global.postMessage(MESSAGE_PREFIX + handle, "*");

            return handle;
        };
    }

    function installReadyStateChangeImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var scriptEl = global.document.createElement("script");
            scriptEl.onreadystatechange = function () {
                tasks.runIfPresent(handle);

                scriptEl.onreadystatechange = null;
                scriptEl.parentNode.removeChild(scriptEl);
                scriptEl = null;
            };
            global.document.documentElement.appendChild(scriptEl);

            return handle;
        };
    }

    function installSetTimeoutImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            global.setTimeout(function () {
                tasks.runIfPresent(handle);
            }, 0);

            return handle;
        };
    }

    if (!global.setImmediate) {
        // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
        var attachTo = typeof Object.getPrototypeOf === "function" && "setTimeout" in Object.getPrototypeOf(global) ?
                          Object.getPrototypeOf(global)
                        : global;

        if (canUseNextTick()) {
            // For Node.js before 0.9
            installNextTickImplementation(attachTo);
        } else if (canUsePostMessage()) {
            // For non-IE10 modern browsers
            installPostMessageImplementation(attachTo);
        } else if (canUseMessageChannel()) {
            // For web workers, where supported
            installMessageChannelImplementation(attachTo);
        } else if (canUseReadyStateChange()) {
            // For IE 6–8
            installReadyStateChangeImplementation(attachTo);
        } else {
            // For older browsers
            installSetTimeoutImplementation(attachTo);
        }

        attachTo.clearImmediate = tasks.remove;
    }
}(typeof global === "object" && global ? global : this));

},{"__browserify_process":8}],11:[function(require,module,exports){
module.exports={
    "name": "imboclient-js",
    "description": "An Imbo client for node.js and recent browsers",
    "version": "2.0.0-beta",
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
        "request": "~2.25.0",
        "jshashes": "~1.0.4"
    },
    "devDependencies": {
        "grunt": "~0.4.1",
        "grunt-browserify": "~1.2.8",
        "grunt-contrib-uglify": "~0.2.2",
        "grunt-contrib-jshint": "~0.6.0",
        "grunt-contrib-watch": "~0.4.0",
        "grunt-contrib-connect": "~0.2.0",
        "grunt-contrib-clean": "~0.4.0",
        "grunt-mocha-test": "~0.6.2",
        "through": "~2.3.4",
        "matchdep": "~0.1.1",
        "mocha": "~1.12.0",
        "nock": "~0.22.1",
        "should": "~1.2.2",
        "blanket": "~1.1.5",
        "setimmediate": "~1.0.1"
    },
    "scripts": {
        "test": "make test",
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
;