var util    = require('util')
  , req     = require('request')
  , crypto  = require('crypto')
  , fs      = require('fs')
  , ImboUrl = require('./url')
  , info    = require(__dirname + '/../package.json')
  , request = req.defaults({
    headers: {
        'Accept'    : 'application/json,image/*',
        'User-Agent': info.name + ' ' + info.version + (typeof process !== 'undefined' ? (' (node ' + process.version + ')') : '')
    }
  })
  , undef;

function ImboClient(serverUrls, publicKey, privateKey) {
    this.options = {
        hosts:      this.parseUrls(serverUrls),
        publicKey:  publicKey,
        privateKey: privateKey
    };
}

/**
 * Base/core methods
 */
ImboClient.prototype.getImageIdentifier = function(imgPath, callback) {
    return md5file(imgPath, callback);
};

ImboClient.prototype.getImageUrl = function(imageIdentifier) {
    var host = this.getHostForImageIdentifier(imageIdentifier);
    return new ImboUrl(host, this.options.publicKey, this.options.privateKey, imageIdentifier);
};

ImboClient.prototype.getResourceUrl = function(resourceIdentifier, path) {
    return new ImboUrl(this.options.hosts[0], this.options.publicKey, this.options.privateKey, resourceIdentifier, path);
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
    var signature = crypto.createHmac('sha256', this.options.privateKey).update(data).digest('hex');
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
    var url = this.getResourceUrl(imageIdentifier), undef;

    request.head({
        uri: url.toString()
    }, function(err, res) {
        if (err) {
            return callback(err, res);
        } else if (res.statusCode !== 200) {
            return callback(getErrorMessage(res), res);
        }
        return callback(undef, res);
    });
};

ImboClient.prototype.deleteImage = function(imgPath, callback) {
    var self = this;
    self.getImageIdentifier(imgPath, function(err, imageIdentifier) {
        if (err) {
            return callback(err);
        }

        self.deleteImageByIdentifier(imageIdentifier, callback);
    });
};

ImboClient.prototype.deleteImageByIdentifier = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier));

    request.del({
        uri: url,
        json: true
    }, function(err, res) {
        if (err || (res && res.statusCode != 200)) {
            return callback(err || getErrorMessage(res), res);
        }

        callback(undef, res);
    });
};

ImboClient.prototype.imageIdentifierExists = function(identifier, callback) {
    this.headImage(identifier, function(err, res) {
        if (err && (err == 404 || (res && res.statusCode == 404))) {
            return callback(undef, false);
        } else if (err) {
            return callback(err);
        } else if (res && res.statusCode != 404 && res.statusCode != 200) {
            return callback(getErrorMessage(res));
        }

        callback(undef, res.statusCode == 200);
    });
};

ImboClient.prototype.imageExists = function(imgPath, callback) {
    var self = this;
    self.getImageIdentifier(imgPath, function(err, imageIdentifier) {
        if (err) {
            return callback(err);
        }

        self.imageIdentifierExists(imageIdentifier, callback);
    });
};

ImboClient.prototype.addImage = function(imgPath, callback) {
    var self = this;

    self.getImageIdentifier(imgPath, function(err, imageIdentifier) {
        if (err) {
            return callback(err);
        }

        fs.stat(imgPath, function (err, stat) {
            if (err) {
                return callback(err);
            }

            var url = self.getSignedResourceUrl('PUT', self.getResourceUrl(imageIdentifier));
            fs.createReadStream(imgPath).pipe(request.put({url: url, headers: getHeadersForPutRequest(stat.size)}, function(err, res) {
                if (err) {
                    return callback(err);
                } else if (res.statusCode != 201) {
                    return callback(getErrorMessage(res), null, res);
                }
                return callback(undef, res.headers['x-imbo-imageidentifier'], res);
            }));
        });
    });
};


/**
 * Metadata methods
 */
ImboClient.prototype.getMetadata = function(imageIdentifier, callback) {
    var url = this.getResourceUrl(imageIdentifier, '/meta');
    request.get({
        uri: url.toString(),
        json: true
    }, function(err, res) {
        if (err || (res && res.statusCode != 200)) {
            return callback(err || getErrorMessage(res), null, res);
        }

        callback(undef, res.body, res);
    });
};

ImboClient.prototype.deleteMetadata = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier, '/meta'));
    request.del({
        uri: url,
        json: true
    }, function(err, res) {
        if (err || (res && res.statusCode != 200)) {
            return callback(err || getErrorMessage(res), res);
        }

        callback(undef, res);
    });
};

ImboClient.prototype.editMetadata = function(imageIdentifier, data, callback) {
    var url = this.getSignedResourceUrl('POST', this.getResourceUrl(imageIdentifier, '/meta'));
    request.post({
        uri: url,
        json: data
    }, function(err, res) {
        if (err || (res && res.statusCode != 200 && res.statusCode != 201)) {
            return callback(err || getErrorMessage(res), res);
        }

        callback(undef, res);
    });
};

/**
 * Utility methods
 */

function getHeadersForPutRequest(contentLength) {
    return {
                'Accept'    : 'application/json,image/*',
                'Content-Length': contentLength,
                'User-Agent': info.name + ' ' + info.version + (typeof process !== 'undefined' ? (' (node ' + process.version + ')') : '')
            }
}

function md5file(filename, callback) {
    fs.stat(filename, function(err, stats) {
        if (err || !stats.isFile()) {
            return callback('File does not exist (' + filename + ')');
        }

        var md5 = crypto.createHash('md5');
        var stream = fs.createReadStream(filename);
        stream.on('data', function(data) {
            md5.update(data);
        });

        stream.on('end', function() {
            callback(undef, md5.digest('hex'));
        });
    });
}

function getErrorMessage(res) {
    if (!res) {
        return 'Unknown error';
    }

    return res.headers['x-imbo-error-message'] || res.statusCode;
}

module.exports = ImboClient;
