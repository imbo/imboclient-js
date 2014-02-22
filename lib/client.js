/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var ImboUrl   = require('./url'),
    ImboQuery = require('./query'),
    crypto    = require('./node/crypto'),
    request   = require('./node/request'),
    readers   = require('./node/readers'),
    features  = require('./browser/feature-support');

var ImboClient = function(serverUrls, publicKey, privateKey) {
    this.options = {
        hosts:      this.parseUrls(serverUrls),
        publicKey:  publicKey,
        privateKey: privateKey
    };

    features.checkFeatures();
};

/**
 *
 */

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
