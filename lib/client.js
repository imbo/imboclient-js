/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var ImboUrl = require('./url/url'),
    ImageUrl = require('./url/imageurl'),
    ShortUrl = require('./url/shorturl'),
    ImboQuery = require('./query'),
    extend = require('./utils/extend'),
    jsonparse = require('./utils/jsonparse'),
    crypto = require('./node/crypto'),
    request = require('./node/request'),
    readers = require('./node/readers'),
    features = require('./browser/feature-support'),
    parseUrls = require('./utils/parse-urls');

var isBrowser = typeof window !== 'undefined';

/**
 * Constructs a new Imbo client
 *
 * @param {Object} options
 * @param {String} publicKey
 * @param {String} privateKey
 * @throws Will throw an error if there are unsupported features
 */
function ImboClient(options, publicKey, privateKey) {
    // Run a feature check, ensuring all required features are present
    features.checkFeatures();

    // Initialize options
    var opts = this.options = {
        hosts: parseUrls(options.hosts || options),
        publicKey: options.publicKey || publicKey,
        privateKey: options.privateKey || privateKey,
        user: options.user || options.publicKey || publicKey
    };

    // Validate options
    ['publicKey', 'privateKey', 'user'].forEach(function validateOption(opt) {
        if (!opts[opt] || typeof opts[opt] !== 'string') {
            throw new Error('`options.' + opt + '` must be a valid string');
        }
    });
}

extend(ImboClient.prototype, {
    /**
     * Set the user on which commands performed by this client should be performed on
     *
     * @param {String} user
     * @return {ImboClient}
     */
    user: function(user) {
        this.options.user = user;
        return this;
    },

    /**
     * Add a new image to the server from a local file
     *
     * @param {String|File} file     - Path to the local image, or an instance of File
     * @param {Function}    callback - Function to call when image has been uploaded
     * @return {ImboClient}
     */
    addImage: function(file, callback) {
        if (isBrowser && file instanceof window.File) {
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
                onComplete: function(addErr, res, body) {
                    callback(addErr, body ? body.imageIdentifier : null, body, res);
                }
            }));
        }.bind(this));

        return this;
    },

    /**
     * Add an image from a Buffer, String or File instance
     *
     * @param {Buffer|ArrayBuffer|String|File} source
     * @param {Function} callback
     * @return {ImboClient}
     */
    addImageFromBuffer: function(source, callback) {
        var url = this.getSignedResourceUrl('POST', this.getImagesUrl()),
            isFile = isBrowser && source instanceof window.File,
            onComplete = callback.onComplete || callback,
            onProgress = callback.onProgress || null;

        request({
            method: 'POST',
            uri: url,
            body: source,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'imboclient-js',
                'Content-Length': isFile ? source.size : source.length
            },
            onComplete: function(err, res, body) {
                body = jsonparse(body);
                onComplete(err, body ? body.imageIdentifier : null, body, res);
            },
            onProgress: onProgress
        });

        return this;
    },

    /**
     * Add an image from a remote URL
     *
     * @param {String}   url
     * @param {Function} callback
     * @return {ImboClient}
     */
    addImageFromUrl: function(url, callback) {
        if (isBrowser) {
            // Browser environments can't pipe, so download the file and add it
            return this.getImageDataFromUrl(url, function(err, data) {
                if (err) {
                    return callback(err);
                }

                this.addImageFromBuffer(data, callback);
            }.bind(this));
        }

        // Pipe the source URL into a POST-request
        request({ uri: url }).pipe(request({
            method: 'POST',
            uri: this.getSignedResourceUrl('POST', this.getImagesUrl()),
            json: true,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'imboclient-js'
            },
            onComplete: function(err, res, body) {
                callback(err, body ? body.imageIdentifier : null, body, res);
            }
        }));

        return this;
    },

    /**
     * Get the server statistics
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getServerStats: function(callback) {
        request.get(this.getStatsUrl(), function(err, res, body) {
            callback(err, body, res);
        });

        return this;
    },

    /**
     * Get the server status
     *
     * @param {Function} callback
     * @return {ImboClient}
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

        return this;
    },

    /**
     * Fetch the user info of the current user
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getUserInfo: function(callback) {
        request.get(this.getUserUrl(), function(err, res, body) {
            if (body && body.lastModified) {
                body.lastModified = new Date(body.lastModified);
            }

            if (body && !body.user && body.publicKey) {
                body.user = body.publicKey;
            }

            callback(err, body, res);
        });

        return this;
    },

    /**
     * Delete an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteImage: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier, { usePrimaryHost: true }),
            signedUrl = this.getSignedResourceUrl('DELETE', url);

        request.del(signedUrl, callback);
        return this;
    },

    /**
     * Get properties about an image stored in Imbo
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImageProperties: function(imageIdentifier, callback) {
        this.headImage(imageIdentifier, function(err, res) {
            if (err) {
                return callback(err);
            }

            var headers = res.headers,
                prefix = 'x-imbo-original';

            callback(err, {
                width: parseInt(headers[prefix + 'width'], 10),
                height: parseInt(headers[prefix + 'height'], 10),
                filesize: parseInt(headers[prefix + 'filesize'], 10),
                extension: headers[prefix + 'extension'],
                mimetype: headers[prefix + 'mimetype']
            });
        });

        return this;
    },

    /**
     * Edit metadata of an image
     *
     * @param {String}   imageIdentifier
     * @param {Object}   data
     * @param {Function} callback
     * @param {String}   method HTTP method to use (POST/PUT)
     * @return {ImboClient}
     */
    editMetadata: function(imageIdentifier, data, callback, method) {
        var url = this.getMetadataUrl(imageIdentifier);

        request({
            method: method || 'POST',
            uri: this.getSignedResourceUrl(method || 'POST', url),
            json: data,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });

        return this;
    },

    /**
     * Replace metadata of an image
     *
     * @param {String}   imageIdentifier
     * @param {Object}   data
     * @param {Function} callback
     * @return {ImboClient}
     */
    replaceMetadata: function(imageIdentifier, data, callback) {
        return this.editMetadata(imageIdentifier, data, callback, 'PUT');
    },

    /**
     * Get metadata attached to an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    getMetadata: function(imageIdentifier, callback) {
        request.get(this.getMetadataUrl(imageIdentifier), function(err, res, body) {
            callback(err, body, res);
        });

        return this;
    },

    /**
     * Delete all metadata associated with an image
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteMetadata: function(imageIdentifier, callback) {
        var url = this.getMetadataUrl(imageIdentifier);

        request.del(this.getSignedResourceUrl('DELETE', url), callback);
        return this;
    },

    /**
     * Get a list of images currently stored on the server,
     * and optionally provide a query to filter the results
     *
     * @param {Query|Function} query - A query to use for filtering. If a function
     *                                 is passed, it will be used as the callback
     *                                 and the query will use default settings
     * @param {Function} callback
     * @return {ImboClient}
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
                body && body.images,
                body && body.search,
                res
            );
        });

        return this;
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
            path: '/users/' + this.options.user
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
        if (typeof imageIdentifier !== 'string' || imageIdentifier.length === 0) {
            throw new Error(
                '`imageIdentifier` must be a non-empty string, was "' + imageIdentifier + '"' +
                ' (' + typeof imageIdentifier + ')'
            );
        }

        options = options || {};

        return new ImageUrl({
            baseUrl: this.getHostForImageIdentifier(
                imageIdentifier,
                options.usePrimaryHost
            ),
            path: options.path,
            user: this.options.user,
            publicKey: this.options.publicKey,
            privateKey: this.options.privateKey,
            imageIdentifier: imageIdentifier
        });
    },

    /**
     * Parse a URL-string and return an ImageUrl instance
     *
     * @param  {String} url
     * @param  {String} [privateKey]
     * @return {Imbo.ImageUrl}
     */
    parseImageUrl: function(url, privateKey) {
        return ImageUrl.parse(url, privateKey || this.options.privateKey);
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
            user: typeof options.user !== 'undefined' ? options.user : this.options.user,
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
     * @return {ImboClient}
     */
    getShortUrl: function(imageUrl, callback) {
        var url = imageUrl.clone(),
            extension = url.getExtension(),
            imageId = url.getImageIdentifier(),
            host = this.getHostForImageIdentifier(imageId);

        var data = {
            imageIdentifier: imageId,
            user: url.getUser(),
            publicKey: url.getPublicKey(),
            query: url.getQueryString()
        };

        if (extension) {
            data.extension = extension;
        }

        // Reset to remove transformations/query string
        url.reset().setPath('/shorturls');

        request({
            method: 'POST',
            uri: this.getSignedResourceUrl('POST', url.toString()),
            json: data,
            onComplete: function(err, res, body) {
                if (err) {
                    return callback(err);
                } else if (!body || !body.id) {
                    return callback('No ShortUrl was returned from server');
                }

                callback(err, new ShortUrl({ baseUrl: host, id: body.id }));
            }
        });

        return this;
    },

    /**
     * Delete all ShortUrls for a given imageIdentifier
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteAllShortUrlsForImage: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier).setPath('/shorturls'),
            signed = this.getSignedResourceUrl('DELETE', url);

        request.del(signed, callback);
        return this;
    },

    /**
     * Delete a ShortUrl for a given imageIdentifier
     *
     * @param {String}               imageIdentifier
     * @param {String|Imbo.ShortUrl} shortUrl
     * @param {Function}             callback
     * @return {ImboClient}
     */
    deleteShortUrlForImage: function(imageIdentifier, shortUrl, callback) {
        var id = shortUrl instanceof ShortUrl ? shortUrl.getId() : shortUrl,
            url = this.getImageUrl(imageIdentifier).setPath('/shorturls/' + id),
            signed = this.getSignedResourceUrl('DELETE', url);

        request.del(signed, callback);
        return this;
    },

    /**
     * Get number of images currently stored for the user
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getNumImages: function(callback) {
        this.getUserInfo(function(err, info) {
            callback(err, info && info.numImages);
        });

        return this;
    },

    /**
     * Checks if a given image exists on the server
     *
     * @param {String}   imgPath
     * @param {Function} callback
     * @return {ImboClient}
     */
    imageExists: function(imgPath, callback) {
        this.getImageChecksum(imgPath, function(err, checksum) {
            if (err) {
                return callback(err);
            }

            this.imageWithChecksumExists(checksum, callback);
        }.bind(this));

        return this;
    },

    /**
     * Checks if a given image identifier exists on the server
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    imageIdentifierExists: function(imageIdentifier, callback) {
        this.headImage(imageIdentifier, function(err, res) {
            // If we encounter an error from the server, we might not have
            // statusCode available - in this case, fall back to undefined
            var statusCode = res && res.statusCode ? res.statusCode : null;

            // Request error?
            var reqErr = err && err.statusCode !== 404 ? err : null;

            // Requester returns error on 404, we expect this to happen
            callback(reqErr, statusCode === 200);
        });

        return this;
    },

    /**
     * Checks if an image with the given MD5-sum exists on the server
     *
     * @param {String}   checksum
     * @param {Function} callback
     * @return {ImboClient}
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

        return this;
    },

    /**
     * Fetch the resource groups available
     *
     * @param {Function} callback
     * @return {ImboClient}
     */
    getResourceGroups: function(callback) {
        request.get(
            this.getResourceUrl({ path: '/groups', user: null }),
            function onResourceGroupResponse(err, res, body) {
                callback(
                    err,
                    body && body.groups,
                    body && body.search,
                    res
                );
            }
        );
        return this;
    },

    /**
     * Create/edit a resource group, setting the resources that should be available to it
     *
     * @param {String} groupName
     * @param {Array} resources
     * @param {Function} callback
     * @return {ImboClient}
     */
    editResourceGroup: function(groupName, resources, callback) {
        var url = this.getResourceUrl({ path: '/groups/' + groupName, user: null });
        request({
            method: 'PUT',
            uri: this.getSignedResourceUrl('PUT', url),
            json: resources,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });

        return this;
    },

    /**
     * Delete the resource group with the given name
     *
     * @param {String} groupName Name fo the group you want to delete
     * @param {Function} callback
     * @return {ImboClient}
     */
    deleteResourceGroup: function(groupName, callback) {
        var url = this.getResourceUrl({ path: '/groups/' + groupName, user: null });
        request.del(this.getSignedResourceUrl('DELETE', url), callback);

        return this;
    },

    /**
     * Add a public/private key pair
     *
     * @param {String} publicKey Public key you want to add
     * @param {String} privateKey Private key for the public key
     * @param {Function} callback
     * @return {ImboClient}
     */
    addPublicKey: function(publicKey, privateKey, callback) {
        this.publicKeyExists(publicKey, function onPubKeyExistsResponse(err, exists) {
            if (err) {
                return callback(err);
            }

            if (exists) {
                return callback(new Error(
                    'Public key `' + publicKey + '` already exists'
                ));
            }

            this.editPublicKey(publicKey, privateKey, callback);
        }.bind(this));

        return this;
    },

    /**
     * Edit a public/private key pair
     *
     * @param {String} publicKey Public key you want to edit
     * @param {String} privateKey Private key for the public key
     * @param {Function} callback
     * @return {ImboClient}
     */
    editPublicKey: function(publicKey, privateKey, callback) {
        if (!publicKey || !privateKey) {
            throw new Error('Both public key and private key must be specified');
        }

        var url = this.getResourceUrl({ path: '/keys/' + publicKey, user: null });
        request({
            method: 'PUT',
            uri: this.getSignedResourceUrl('PUT', url),
            json: { privateKey: privateKey },
            onComplete: callback
        });

        return this;
    },

    /**
     * Delete a public key
     *
     * @param {String} publicKey Public key you want to delete
     * @param {Function} callback
     * @return {ImboClient}
     */
    deletePublicKey: function(publicKey, callback) {
        var url = this.getResourceUrl({ path: '/keys/' + publicKey, user: null });
        request.del(this.getSignedResourceUrl('DELETE', url), callback);

        return this;
    },

    /**
     * Check whether a public key exists or not
     *
     * @param {String} publicKey Public key you want to check for the presence of
     * @param {Function} callback
     * @return {ImboClient}
     */
    publicKeyExists: function(publicKey, callback) {
        request.head(
            this.getResourceUrl({ path: '/keys/' + publicKey, user: null }),
            function onPublicKeyExistsResponse(err, res) {
                // If we encounter an error from the server, we might not have
                // statusCode available - in this case, fall back to undefined
                var statusCode = res && res.statusCode ? res.statusCode : null;

                // Request error?
                var reqErr = err && err.statusCode !== 404 ? err : null;

                // Requester returns error on 404, we expect this to happen
                callback(reqErr, statusCode === 200);
            }
        );
        return this;
    },

    /**
     * Add one or more access control rules to the given public key
     *
     * @param {String} publicKey The public key to add rules to
     * @param {Array} rules Array of access control rules to add
     * @param {Function} callback
     * @return {ImboClient}
     */
    addAccessControlRule: function(publicKey, rules, callback) {
        if (!Array.isArray(rules)) {
            rules = [rules];
        }

        if (!publicKey) {
            throw new Error('Public key must be a valid string');
        }

        var url = this.getResourceUrl({ path: '/keys/' + publicKey + '/access', user: null });

        request({
            method: 'POST',
            uri: this.getSignedResourceUrl('POST', url),
            json: rules,
            onComplete: function(err, res, body) {
                callback(err, body, res);
            }
        });

        return this;
    },

    /**
     * Get the binary data of an image stored on the server
     *
     * @param {String} imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImageData: function(imageIdentifier, callback) {
        var url = this.getImageUrl(imageIdentifier);
        this.getImageDataFromUrl(url, callback);
        return this;
    },

    /**
     * Get the binary data of an image, specified by URL
     *
     * @param {String}   imageUrl
     * @param {Function} callback
     * @return {ImboClient}
     */
    getImageDataFromUrl: function(imageUrl, callback) {
        readers.getContentsFromUrl(imageUrl.toString(), function(err, data) {
            callback(err, err ? null : data);
        });

        return this;
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

        var dec = imageIdentifier.charCodeAt(imageIdentifier.length - 1);

        // If this is an old image identifier (32 character hex string),
        // maintain backwards compatibility
        if (imageIdentifier.match(/^[a-f0-9]{32}$/)) {
            dec = parseInt(imageIdentifier.substr(0, 2), 16);
        }

        return this.options.hosts[dec % this.options.hosts.length];
    },

    /**
     * Get an MD5 checksum for the given image
     *
     * @param {String|File} image
     * @param {Function}    callback
     * @return {ImboClient}
     */
    getImageChecksum: function(image, callback) {
        crypto.md5(image, callback);
        return this;
    },

    /**
     * Get an MD5 checksum for the given buffer or string
     *
     * @param {Buffer|String} buffer
     * @param {Function}      callback
     * @return {ImboClient}
     */
    getImageChecksumFromBuffer: function(buffer, callback) {
        crypto.md5(buffer, callback, {
            binary: true,
            type: 'string'
        });

        return this;
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
            addPubKey = this.options.user !== this.options.publicKey,
            qs = url.toString().indexOf('?') > -1 ? '&' : '?',
            signUrl = addPubKey ? url + qs + 'publicKey=' + this.options.publicKey : url,
            signature = this.generateSignature(method, signUrl.toString(), timestamp);

        qs = addPubKey ? '&' : qs;
        qs += 'signature=' + encodeURIComponent(signature);
        qs += '&timestamp=' + encodeURIComponent(timestamp);

        return signUrl + qs;
    },

    /**
     * Performs an HTTP HEAD requests against the given image identifier
     *
     * @param {String}   imageIdentifier
     * @param {Function} callback
     * @return {ImboClient}
     */
    headImage: function(imageIdentifier, callback) {
        request.head(
            this.getImageUrl(imageIdentifier, { usePrimaryHost: true }),
            callback
        );

        return this;
    }
});

module.exports = ImboClient;
