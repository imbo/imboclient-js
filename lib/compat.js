// Compatability layer for browsers
// <Node>
if (typeof module !== 'undefined') {
    // Node environment, we want to expose node-specific methods on module.exports
    var crypto  = require('crypto')
      , fs      = require('fs')
      , request = require('request')
      , env     = ('node ' + process.version)
      , Imbo    = {
          'Node'    : true,
          'Version' : require('../package.json').version
      };
}
// </Node>

(function(env, undef) {

    var headers = {
        'Accept'    : 'application/json,image/*',
        'User-Agent': 'imboclient-js ' + Imbo.Version + ' (' + (env || navigator.userAgent) + ')'
    };

    Imbo.Compat = {
        sha256: function(key, data) {
            // <Node>
            if (Imbo.Node) {
                return crypto.createHmac('sha256', key).update(data).digest('hex');
            }
            // </Node>

            return Imbo.Browser.sha256(key, data);
        },

        md5: function(buffer, callback, isString) {
            // <Node>
            if (Imbo.Node) {
                // String?
                if (isString) {
                    return callback(undef, crypto.createHash('md5').update(buffer).digest('hex'));
                }

                // File
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

                return;
            }
            // </Node>

            // <Browser>
            if (buffer instanceof File) {
                return Imbo.Browser.getContentsFromFile(buffer, function(err, data) {
                    Imbo.Compat.md5(data, callback);
                });
            }

            return callback(undef, Imbo.Browser.md5(buffer), {
                size: buffer.length
            });
        },

        request: function(method, uri, data, callback) {
            method = method.toUpperCase();
            if (!callback && (data.complete || typeof data === 'function')) {
                callback = data;
                data = null;
            }

            var onComplete  = callback.complete || callback;
            var jsonRequest = (data && data.constructor && data.constructor.name == 'Object');
            var reqHeaders  = (method == 'PUT') ? Imbo.Compat.getPutHeaders(data ? data.length : 0) : headers;

            if (jsonRequest) {
                reqHeaders['Content-Type'] = 'application/json';
                data = JSON.stringify(data);
            }

            // <Node>
            if (Imbo.Node) {
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
                    onComplete(err, res, body);
                });
            }
            // </Node>

            // <Browser>
            var xhr = new XMLHttpRequest(), etag, getReq = (method == 'GET');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status !== 0 && onComplete) {
                    etag = xhr.getResponseHeader('etag');
                    getReq && etag && Imbo.Browser.EtagCache.put(uri, etag, xhr.responseText);

                    onComplete(undef, Imbo.Compat.requestDone(xhr, jsonRequest, uri));
                }
            };
            xhr.open(method, uri, true);
            xhr.setRequestHeader('Accept', headers.Accept);

            etag = Imbo.Browser.EtagCache.get(uri);
            if (method == 'GET' && etag) {
                xhr.setRequestHeader('If-None-Match', etag.tag);
            }

            xhr.onerror = function() {
                onComplete('XMLHttpRequest failed - CORS disabled?');
            };

            if (callback.progress) {
                xhr.upload.addEventListener('progress', callback.progress, false);
            }
            if (callback.uploadComplete) {
                xhr.upload.addEventListener('load', callback.uploadComplete, false);
            }
            if (method == 'PUT') {
                xhr.sendAsBinary(data);
            } else {
                xhr.send(data);
            }
        },

        requestDone: function(xhr, json, uri) {
            var headers    = xhr.getAllResponseHeaders().split("\n")
              , resHeaders = {}
              , i          = headers.length
              , response   = xhr.responseText
              , item
              , pos;

            while (--i) {
                item = headers[i].trim();
                pos  = item.indexOf(':');
                if (pos == -1) { continue; }

                resHeaders[item.slice(0, pos)] = item.slice(pos + 2);
            }

            if (xhr.status == 304 && !response.length) {
                var etag = Imbo.Browser.EtagCache.get(uri);
                response = etag.content;
            }

            if (resHeaders['Content-Type'] == 'application/json') {
                json = true;
            }

            return {
                statusCode: xhr.status,
                body      : json ? JSON.parse(response) : response,
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
        },

        getContentsFromUrl: function(url, callback) {
            // <Node>
            if (Imbo.Node) {
                return request({
                    uri   : url,
                    method: 'GET'
                }, function(err, res, body) {
                    callback(err, body);
                });
            }
            // </Node>

            return Imbo.Browser.getContentsFromUrl(url, callback);
        },

        getContents: function(file, callback) {
            // <Node>
            if (Imbo.Node) {
                if (typeof file != 'string') {
                    return callback('getContents() - not sure what to do with the passed file');
                }

                return fs.readFile(file, function(err, data) {
                    if (err && err.code == 'ENOENT') {
                        return callback('File does not exist (' + err.path + ')');
                    }

                    callback(err, data);
                });
            }
            // </Node>

            return Imbo.Browser.getContentsFromFile(file, callback);
        },

        purgeCache: function(url) {
            // <Node>
            if (Imbo.Node) {
                return;
            }
            // </Node>

            return Imbo.Browser.EtagCache.purge(url);
        }
    };

    // <Node>
    if (Imbo.Node) {
        module.exports = Imbo.Compat;
    }
    // </Node>

})(typeof env === 'undefined' ? null : env);
