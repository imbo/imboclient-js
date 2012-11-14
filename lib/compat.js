// Compatability layer for browsers
if (typeof module !== 'undefined') {
    // Node environment, we want to expose node-specific methods on module.exports
    var crypto  = require('crypto')
      , fs      = require('fs')
      , request = require('request')
      , env     = ('node ' + process.version)
      , Imbo    = {
          'Node'      : true,
          'Version'   : require('../package.json').version
      };
}

(function(env, undef) {

    var headers = {
        'Accept'    : 'application/json,image/*',
        'User-Agent': 'imboclient-js ' + Imbo.Version + ' (' + (env || navigator.userAgent) + ')'
    };

    Imbo.Compat = {
        sha256: function(key, data) {
            if (Imbo.Node) {
                return crypto.createHmac('sha256', key).update(data).digest('hex');
            }

            return CryptoJS.HmacSHA256(data, key).toString();
        },

        md5: function(buffer, callback) {
            // Browser? Assume string
            if (!Imbo.Node) {
                return callback(undef, Imbo.Browser.md5(buffer), {
                    size: buffer.length
                });
            }

            // Filename?
            fs.stat(buffer, function(err, stats) {
                if (err || !stats.isFile()) {
                    return callback('File does not exist (' + buffer + ')');
                }

                var md5 = crypto.createHash('md5');
                var stream = fs.createReadStream(buffer);
                stream.on('data', function(data) {
                    md5.update(data);
                });

                stream.on('end', function() {
                    callback(undef, md5.digest('hex'), stats);
                });
            });
        },

        request: function(method, uri, data, callback) {
            method = method.toUpperCase();
            if (!callback && (data.complete || typeof data === 'function')) {
                callback = data;
                data = null;
            }

            var jsonRequest = (data && data.constructor && data.constructor.name == 'Object');
            var reqHeaders  = (method == 'PUT') ? Imbo.Compat.getPutHeaders(data.length) : headers;

            if (jsonRequest) {
                reqHeaders['Content-Type'] = 'application/json';
                data = JSON.stringify(data);
            }

            if (Imbo.Node) {
                // Node environment
                var options = {
                    'method'  : method,
                    'uri'     : uri,
                    'headers' : reqHeaders
                };

                if (method == 'POST') {
                    options['body'] = data;
                }

                return request(options, function(err, res, body) {
                    if (res && res.headers['content-type'] == 'application/json') {
                        res.body = JSON.parse(body) || body;
                    }
                    (callback.complete || callback)(err, res, body);
                });
            }

            // Browser environment
            var xhr = new XMLHttpRequest();
            for (var key in reqHeaders) {
                xhr.setRequestHeader(key, reqHeaders[key]);
            }
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && callback) {
                    (callback.complete || callback)(undef, Imbo.Compat.requestDone(xhr, jsonRequest));
                }
            };
            xhr.open(method, uri, true);

            if (callback.progress) {
                xhr.upload.addEventListener('progress', callback.progress, false);
            }
            if (cbs.uploadComplete) {
                xhr.upload.addEventListener('load', callback.uploadComplete, false);
            }
            if (method == 'PUT') {
                xhr.sendAsBinary(data);
            } else {
                xhr.send(data);
            }
        },

        requestDone: function(xhr, json) {
            var allHeaders = xhr.getAllResponseHeaders()
              , resHeaders = {};

            if (allHeaders) {
                var lines = allHeaders.split("\n");
                var i = lines.length, parts;
                while (i--) {
                    parts = lines[i].split(':');
                    allHeaders[parts[0].toLowerCase()] = parts.splice(1).join(': ');
                }
            }

            return {
                statusCode: xhr.status,
                body      : json ? JSON.parse(xhr.responseText) : xhr.responseText,
                headers   : resHeaders
            };
        },

        getPutHeaders: function(length) {
            var putHeaders = {};
            for (var key in headers) {
                putHeaders[key] = headers[key];
            }

            if (length) {
                putHeaders['Content-Length'] = length;
            }
            return putHeaders;
        }
    };

    if (Imbo.Node) {
        module.exports = Imbo.Compat;
    }

})(env);