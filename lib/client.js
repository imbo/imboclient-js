// <Node>
if (typeof module !== 'undefined') {
    var req     = require('request')
      , crypto  = require('crypto')
      , fs      = require('fs')
      , Imbo    = {
        Node   : true,
        Url    : require('./url'),
        Compat : require('./compat')
    };
}
// </Node>

(function(Imbo, undef) {

    var ImboClient = function(serverUrls, publicKey, privateKey) {
        this.options = {
            hosts:      this.parseUrls(serverUrls),
            publicKey:  publicKey,
            privateKey: privateKey
        };
    };

    var getErrorMessage = function(res) {
        if (res && res.body && res.body.error) {
            return res.body.error.message;
        } else if (res && res.headers) {
            return res.headers['X-Imbo-Error-Internalcode'] || res.statusCode;
        } else if (res) {
            return res;
        }

        return 'Unknown error';
    };

    /**
     * Base/core methods
     */
    ImboClient.prototype.getImageIdentifier = function(image, callback) {
        return Imbo.Compat.md5(image, callback);
    };

    ImboClient.prototype.getImageIdentifierFromString = function(image, callback) {
        return Imbo.Compat.md5(image, callback, true);
    };

    ImboClient.prototype.getImageUrl = function(imageIdentifier) {
        var host = this.getHostForImageIdentifier(imageIdentifier);
        return new Imbo.Url(host, this.options.publicKey, this.options.privateKey, imageIdentifier);
    };

    ImboClient.prototype.getImagesUrl = function(query) {
        return this.getResourceUrl('', '/', query ? query.toString() : null);
    };

    ImboClient.prototype.getUserUrl = function() {
        return this.getResourceUrl();
    };

    ImboClient.prototype.getResourceUrl = function(resourceIdentifier, path, query) {
        return new Imbo.Url(
            this.options.hosts[0],
            this.options.publicKey,
            this.options.privateKey,
            resourceIdentifier,
            path,
            query
        );
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
        var signature = Imbo.Compat.sha256(this.options.privateKey, data);
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
    ImboClient.prototype.headImage = function(imageIdentifier, cb) {
        var callback = cb || function() {};
        var url = this.getResourceUrl(imageIdentifier), undef;

        Imbo.Compat.request('HEAD', url.toString(), function(err, res) {
            if (err) {
                return callback(err, res);
            } else if (res.statusCode !== 200) {
                return callback(getErrorMessage(res), res);
            }
            return callback(undef, res);
        });
    };

    ImboClient.prototype.deleteImage = function(imgPath, cb) {
        var self = this, callback = cb || function() {};
        self.getImageIdentifier(imgPath, function(err, imageIdentifier) {
            if (err) {
                return callback(err);
            }

            self.deleteImageByIdentifier(imageIdentifier, callback);
        });
    };

    ImboClient.prototype.deleteImageByIdentifier = function(imageIdentifier, cb) {
        var callback = cb || function() {};
        var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier));

        Imbo.Compat.request('DELETE', url, function(err, res) {
            if (err || (res && res.statusCode != 200)) {
                return callback(err || getErrorMessage(res), res);
            }

            callback(undef, res);
        });
    };

    ImboClient.prototype.imageIdentifierExists = function(identifier, callback) {
        this.headImage(identifier, function(err, res) {
            if (err && (err == 404 || (res && res.statusCode == 404))) {
                return callback(undef, false, identifier);
            } else if (err) {
                return callback(err);
            } else if (res && res.statusCode != 404 && res.statusCode != 200) {
                return callback(getErrorMessage(res));
            }

            callback(undef, res.statusCode == 200, identifier);
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

    ImboClient.prototype.addImageFromBlob = function(blob, cb) {
        var callback = cb || function() {};
        var self = this, onComplete = callback.complete || callback;
        var start = Date.now();
        self.getImageIdentifierFromString(blob, function(err, imageIdentifier) {
            if (err) {
                return onComplete(err);
            }

            var url = self.getSignedResourceUrl('PUT', self.getResourceUrl(imageIdentifier));

            // Set up PUT-request
            Imbo.Compat.request('PUT', url, blob, {
                complete: function(err, res) {
                    var identifier = res && res.body ? res.body.imageIdentifier : imageIdentifier;
                    if (err) {
                        return onComplete(err, identifier, res);
                    } else if (res.statusCode != 201) {
                        return onComplete(getErrorMessage(res), identifier, res);
                    }

                    return onComplete(undef, identifier, res);
                },
                progress: callback.progress || null,
                uploadComplete: callback.uploadComplete || null
            });
        });
    };

    /**
     * Add a new image to the server (from filesystem)
     *
     * @param {string|File}  path  Path to the local image, or an instance of File
     * @param {Function}     cb    Function to call when image has been uploaded
     */
    ImboClient.prototype.addImage = function(path, cb) {
        var self = this, callback = cb || function() {};
        Imbo.Compat.getContents(path, function(err, data) {
            if (err) {
                return callback(err);
            }

            self.addImageFromBlob(data, callback);
        });
    };

    ImboClient.prototype.addImageFromUrl = function(url, cb) {
        var self = this, callback = cb || function() {};
        Imbo.Compat.getContentsFromUrl(url, function(err, data) {
            if (err) {
                return callback(err);
            }

            self.addImageFromBlob(data, callback);
        });
    };

    /**
     * Fetch information for a given user/public key
     */
    ImboClient.prototype.getUserInfo = function(callback) {
        Imbo.Compat.request('GET', this.getUserUrl().toString(), function(err, res) {
            if (err || (res && res.statusCode != 200)) {
                return callback(err || getErrorMessage(res), null, res);
            }

            callback(undef, res.body, res);
        });
    };

    /**
     * Fetch images
     */
    ImboClient.prototype.getImages = function(callback, query) {
        // Build the complete URL
        var url = this.getImagesUrl(query);

        // Fetch the response
        Imbo.Compat.request('GET', url.toString(), function(err, res) {
            if (err || (res && res.statusCode != 200)) {
                return callback(err || getErrorMessage(res), null, res);
            }

            callback(undef, res.body, res);
        });
    };

    /**
     * Metadata methods
     */
    ImboClient.prototype.getMetadata = function(imageIdentifier, cb) {
        var url = this.getResourceUrl(imageIdentifier, '/meta');
        var callback = cb || function() {};
        Imbo.Compat.request('GET', url.toString(), function(err, res) {
            if (err || (res && res.statusCode != 200)) {
                return callback(err || getErrorMessage(res), null, res);
            }

            callback(undef, res.body, res);
        });
    };

    ImboClient.prototype.deleteMetadata = function(imageIdentifier, cb) {
        var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier, '/meta'));
        var callback = cb || function() {};
        Imbo.Compat.request('DELETE', url, function(err, res) {
            if (err || (res && res.statusCode != 200)) {
                return callback(err || getErrorMessage(res), res);
            }

            callback(undef, res);
        });
    };

    ImboClient.prototype.editMetadata = function(imageIdentifier, data, cb) {
        var url = this.getSignedResourceUrl('POST', this.getResourceUrl(imageIdentifier, '/meta'));
        var callback = cb || function() {};
        Imbo.Compat.request('POST', url, data, function(err, res) {
            if (err || (res && res.statusCode != 200 && res.statusCode != 201)) {
                return callback(err || getErrorMessage(res), res);
            }

            callback(undef, res);
        });
    };

    // <Node>
    if (typeof module !== 'undefined') {
        module.exports = ImboClient;
    }
    // </Node>

    Imbo.Client = ImboClient;
    return ImboClient;
})(Imbo);