var util    = require('util')
  , request = require('request')
  , crypto  = require('crypto')
  , fs      = require('fs')
  , ImboUrl = require('./url')
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

ImboClient.prototype.getResourceUrl = function(resourceIdentifier) {
    return this.options.hosts[0] + '/users/' + this.options.publicKey + '/images/' + resourceIdentifier;
};

ImboClient.prototype.getSignedResourceUrl = function(method, url, date) {
    var timestamp = (date || new Date()).toISOString().replace(/\.\d+Z$/, 'Z');
    var signature = this.generateSignature(method, url, timestamp);

    var qs = '';
    qs += '?signature=' + encodeURIComponent(signature);
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
        uri: url
    }, function(err, res) {
        if (err) {
            return callback(err, res);
        } else if (res.statusCode !== 200) {
            return callback(res.statusCode, res);
        }
        return callback(undef, res);
    });
};

ImboClient.prototype.deleteImage = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier));
    request.del({
        uri: url,
        json: true
    }, callback);
};

ImboClient.prototype.imageIdentifierExists = function(identifier, callback) {
    this.headImage(identifier, function(err, res) {
        if (err && err != 404) {
            return callback(err);
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

        var url = self.getSignedResourceUrl('PUT', self.getResourceUrl(imageIdentifier));
        fs.ReadStream(imgPath).pipe(request.put(url, function(err, res) {
            if (err) {
                return callback(err);
            } else if (res.statusCode != 201) {
                return callback(res.statusCode, null, res);
            }
            return callback(undef, res.headers['x-imbo-imageidentifier'], res);
        }));
    });
};


/**
 * Metadata methods
 */
ImboClient.prototype.getMetadata = function(imageIdentifier, callback) {
    var url = this.getResourceUrl(imageIdentifier + '/meta');

    request.get({
        uri: url,
        json: true
    }, function(err, res) {
        if (err || (res && res.statusCode != 200)) {
            return callback(err || res.statusCode, res);
        }

        callback(undef, res.body);
    });
};

ImboClient.prototype.deleteMetadata = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier) + '/meta');
    request.del({
        uri: url,
        json: true
    }, function(err, res) {
        if (err || (res && res.statusCode != 200)) {
            return callback(err || res.statusCode, res);
        }

        callback(undef);
    });
};

ImboClient.prototype.editMetadata = function(imageIdentifier, data, callback) {
    var url = this.getSignedResourceUrl('POST', this.getResourceUrl(imageIdentifier) + '/meta');
    request.post({
        uri: url,
        json: data
    }, callback);
};

/**
 * Utility methods
 */
function md5file(filename, callback) {
    fs.exists(filename, function(exists) {
        if (!exists) {
            return callback('File does not exist (' + filename + ')');
        }

        var md5 = crypto.createHash('md5');
        var stream = fs.ReadStream(filename);
        stream.on('data', function(data) {
            md5.update(data);
        });

        stream.on('end', function() {
            callback(undef, md5.digest('hex'));
        });
    });
}

module.exports = ImboClient;