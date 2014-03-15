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
    ImageUrl  = require('./imageurl'),
    ImboQuery = require('./query'),
    extend    = require('./utils/extend'),
    jsonparse = require('./utils/jsonparse'),
    crypto    = require('./node/crypto'),
    request   = require('./node/request'),
    readers   = require('./node/readers'),
    features  = require('./browser/feature-support');

/**
 * Constructs a new Imbo client
 *
 * @param {String|Array} serverUrls
 * @param {String} publicKey
 * @param {String} privateKey
 * @throws Will throw an error if there are unsupported features
 */
var ImboClient = function(serverUrls, publicKey, privateKey) {
    this.options = {
        hosts:      this.parseUrls(serverUrls),
        publicKey:  publicKey,
        privateKey: privateKey
    };

    // Run a feature check, ensuring all required features are present
    features.checkFeatures();
};

extend(ImboClient.prototype, {

    /**
     * Add a new image to the server from a local file
     *
     * @param {String|File} file     - Path to the local image, or an instance of File
     * @param {Function}    callback - Function to call when image has been uploaded
     */
    addImage: function(file, callback) {
        if (typeof window !== 'undefined' && file instanceof window.File) {
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
                onComplete: function(err, res, body) {
                    callback(err, body ? body.imageIdentifier : undefined, body, res);
                }
            }));
        }.bind(this));
    },

    /**
     * Add an image from a Buffer, String or File instance
     *
     * @param {Buffer|ArrayBuffer|String|File} source
     * @param {Function} callback
     */
    addImageFromBuffer: function(source, callback) {
        var url        = this.getSignedResourceUrl('POST', this.getImagesUrl()),
            isFile     = typeof window !== 'undefined' && source instanceof window.File,
            onComplete = callback.onComplete || callback,
            onProgress = callback.onProgress || null;

        request({
            method : 'POST',
            uri    : url,
            body   : source,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'imboclient-js',
                'Content-Length': isFile ? source.size : source.length
            },
            onComplete: function(err, res, body) {
                body = jsonparse(body);
                onComplete(err, body ? body.imageIdentifier : undefined, body, res);
            },
            onProgress: onProgress
        });
    },

    /**
     * Add an image from a remote URL
     *
     * @param {String}   url
     * @param {Function} callback
     */
    addImageFromUrl: function(url, callback) {
        if (typeof window !== 'undefined') {
            // Browser environments can't pipe, so download the file and add it
            return readers.getContentsFromUrl(url, function(err, res, data) {
                if (err) {
                    return callback(err);
                }

                this.addImageFromBuffer(data, callback);
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
                callback(err, body ? body.imageIdentifier : undefined, body, res);
            }
        }));
    },

    /**
     * Get the server statistics
     *
     * @param {Function} callback
     */
    getServerStats: function(callback) {
        request.get(this.getStatsUrl(), function(err, res, body) {
            callback(err, body, res);
        });
    },

    /**
     * Get the server status
     *
     * @param {Function} callback
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
    },

    /**
     * Fetch the user info of the current user
     *
     * @param {Function} callback
     */
    getUserInfo: function(callback) {
        request.get(this.getUserUrl(), function(err, res, body) {
            if (body && body.lastModified) {
                body.lastModified = new Date(body.lastModified);
            }

            callback(err, body, res);
        });
    },

    /**
     * Delete an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    deleteImage: function(imageIdentifier, callback) {
        var url       = this.getImageUrl(imageIdentifier, { usePrimaryHost: true }),
            signedUrl = this.getSignedResourceUrl('DELETE', url);

        request.del(signedUrl, callback);
    },

    /**
     * Get properties about an image stored in Imbo
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    getImageProperties: function(imageIdentifier, callback) {
        this.headImage(imageIdentifier, function(err, res) {
            if (err) {
                return callback(err);
            }

            var headers = res.headers,
                prefix  = 'x-imbo-original';

            callback(err, {
                'width'    : parseInt(headers[prefix + 'width'],    10),
                'height'   : parseInt(headers[prefix + 'height'],   10),
                'filesize' : parseInt(headers[prefix + 'filesize'], 10),
                'extension': headers[prefix + 'extension'],
                'mimetype' : headers[prefix + 'mimetype']
            });
        });
    },

    /**
     * Edit metadata of an image
     *
     * @param {String}   imageIdentifier
     * @param {Object}   data
     * @param {Function} callback
     * @param {String}   [method=POST] HTTP method to use
     */
    editMetadata: function(imageIdentifier, data, callback, method) {
        var url = this.getMetadataUrl(imageIdentifier);

        request({
            method    : method || 'POST',
            uri       : this.getSignedResourceUrl(method || 'POST', url),
            json      : data,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });
    },

    /**
     * Replace metadata of an image
     *
     * @param {String}   imageIdentifier
     * @param {Object}   data
     * @param {Function} callback
     */
    replaceMetadata: function(imageIdentifier, data, callback) {
        this.editMetadata(imageIdentifier, data, callback, 'PUT');
    },

    /**
     * Get metadata attached to an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    getMetadata: function(imageIdentifier, callback) {
        request.get(this.getMetadataUrl(imageIdentifier), function(err, res, body) {
            callback(err, body, res);
        });
    },

    /**
     * Delete all metadata associated with an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    deleteMetadata: function(imageIdentifier, callback) {
        var url = this.getMetadataUrl(imageIdentifier);

        request.del(this.getSignedResourceUrl('DELETE', url), callback);
    },

    /**
     * Get a list of images currently stored on the server,
     * and optionally provide a query to filter the results
     *
     * @param {Query|Function} query - A query to use for filtering. If a function
     *                                 is passed, it will be used as the callback
     *                                 and the query will use default settings
     * @param {Function} callback
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
                body ? body.images : [],
                body ? body.search : {},
                res
            );
        });
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
            path: '/users/' + this.options.publicKey
        });
    },

    /**
     * Get URL for the images endpoint
     *
     * @param {Imbo.Query|String} [query]
     * @return {Imbo.Url}
     */
    getImagesUrl: function(query) {
        var url = this.getUserUrl();
        url.setPath(url.getPath() + '/images');

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
        options = options || {};

        return new ImageUrl({
            baseUrl: this.getHostForImageIdentifier(
                imageIdentifier,
                options.usePrimaryHost
            ),
            path: options.path,
            publicKey: this.options.publicKey,
            privateKey: this.options.privateKey,
            imageIdentifier: imageIdentifier,
        });
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
     */
    getShortUrl: function(imageUrl, callback) {
        request.head(imageUrl.toString(), function(err, res) {
            if (err) {
                return callback(err);
            } else if (!res || !res.headers['x-imbo-shorturl']) {
                return callback('No ShortUrl was returned from server');
            }

            callback(err, res.headers['x-imbo-shorturl']);
        });
    },

    /**
     * Get number of images currently stored for the user
     *
     * @param {Function} callback
     */
    getNumImages: function(callback) {
        this.getUserInfo(function(err, info) {
            callback(err, info ? info.numImages : undefined);
        });
    },

    /**
     * Checks if a given image exists on the server
     *
     * @param {String}   imgPath
     * @param {Function} callback
     */
    imageExists: function(imgPath, callback) {
        this.getImageChecksum(imgPath, function(err, checksum) {
            if (err) {
                return callback(err);
            }

            this.imageWithChecksumExists(checksum, callback);
        }.bind(this));
    },

    /**
     * Checks if a given image identifier exists on the server
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    imageIdentifierExists: function(imageIdentifier, callback) {
        this.headImage(imageIdentifier, function(err, res) {
            // If we encounter an error from the server, we might not have
            // statusCode available - in this case, fall back to undefined
            var statusCode = res && res.statusCode ? res.statusCode : undefined;

            // Requester returns error on 404, we expect this to happen
            callback(isNaN(err) ? err : undefined, statusCode === 200);
        });
    },

    /**
     * Checks if an image with the given MD5-sum exists on the server
     *
     * @param {String}   checksum
     * @param {Function} callback
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
    },

    /**
     * Get the binary data of an image stored on the server
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    getImageData: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier);
        this.getImageDataFromUrl(url, callback);
    },

    /**
     * Get the binary data of an image, specified by URL
     *
     * @param {String}   imageUrl
     * @param {Function} callback
     */
    getImageDataFromUrl: function(imageUrl, callback) {
        readers.getContentsFromUrl(imageUrl.toString(), function(err, res, data) {
            callback(err, err ? undefined : data);
        });
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

        var dec = parseInt(imageIdentifier.slice(0, 2), 16);
        return this.options.hosts[dec % this.options.hosts.length];
    },

    /**
     * Get an MD5 checksum for the given image
     *
     * @param {String|File} image
     * @param {Function}    callback
     */
    getImageChecksum: function(image, callback) {
        crypto.md5(image, callback);
    },

    /**
     * Get an MD5 checksum for the given buffer or string
     *
     * @param {Buffer|String} buffer
     * @param {Function}      callback
     */
    getImageChecksumFromBuffer: function(buffer, callback) {
        crypto.md5(buffer, callback, {
            binary: true,
            type: 'string'
        });
    },

    /**
     * Parse an array of URLs, stripping excessive parts
     *
     * @param  {String|Array} urls
     * @return {Array}
     */
    parseUrls: function(urls) {
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
            signature = this.generateSignature(method, url.toString(), timestamp),
            qs        = url.toString().indexOf('?') > -1 ? '&' : '?';

        qs += 'signature='  + encodeURIComponent(signature);
        qs += '&timestamp=' + encodeURIComponent(timestamp);

        return url + qs;
    },

    /**
     * Performs an HTTP HEAD requests against the given image identifier
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     */
    headImage: function(imageIdentifier, callback) {
        request.head(
            this.getImageUrl(imageIdentifier, { usePrimaryHost: true }),
            callback
        );
    }
});

module.exports = ImboClient;
