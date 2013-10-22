/**
 * Base Imbo client
 */
'use strict';

var ImboUrl = require('./url')
  , crypto  = require('./node/crypto')
  , request = require('./node/request')
  , readers = require('./node/readers')
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