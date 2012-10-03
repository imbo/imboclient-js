// Moo.
var util    = require('util')
  , request = require('request')
  , crypto  = require('crypto')
  , fs      = require('fs');

function ImboClient(serverUrls, publicKey, privateKey) {
    this.options = {
        hosts:      this.parseUrls(serverUrls),
        publicKey:  publicKey,
        privateKey: privateKey
    };
}

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
    self.headImage(identifier, function(err, rss) {
        callback(res.statusCode == 200);
    });
};

ImboClient.prototype.imageExists = function(imgPath, callback) {
    var self = this;
    self.getImageIdentifier(imgPath, function(imageIdentifier) {
        self.headImage(imageIdentifier, function(err, res) {
            callback(res.statusCode == 200);
        });
    });
};

ImboClient.prototype.addImage = function(imgPath, callback) {
    var self = this;

    self.getImageIdentifier(imgPath, function(imageIdentifier) {
        var url = self.getSignedResourceUrl('PUT', self.getResourceUrl(imageIdentifier));
        fs.ReadStream(imgPath).pipe(request.put(url, callback));
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
    }, callback);
};

ImboClient.prototype.deleteMetadata = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', this.getResourceUrl(imageIdentifier) + '/meta');
    request.del({
        uri: url,
        json: true
    }, callback);
};

ImboClient.prototype.editMetadata = function(imageIdentifier, data, callback) {
    var url = this.getSignedResourceUrl('POST', this.getResourceUrl(imageIdentifier) + '/meta');
    request.post({
        uri: url,
        json: data
    }, callback);
};

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

ImboClient.prototype.getSignedResourceUrl = function(method, url) {
    var timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
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
 * Utility methods
 */
function md5file(filename, callback) {
    var md5 = crypto.createHash('md5');

    if (!callback) {
        md5.update(fs.readFileSync(filename));
        return md5.digest('hex');
    }

    var stream = fs.ReadStream(filename);
    stream.on('data', function(data) {
        md5.update(data);
    });

    stream.on('end', function() {
        callback(md5.digest('hex'));
    });
}

/**
 * Imbo URL helper
 */
function ImboUrl(baseUrl, publicKey, privateKey, imageIdentifier) {
    this.data = [];
    this.baseUrl = baseUrl;
    this.publicKey = publicKey;
    this.imageIdentifier = imageIdentifier;
    this.privateKey = privateKey;
}

ImboUrl.prototype.border = function(color, width, height) {
    color  = (color || '000000').replace(/^#/, '');
    width  = parseInt(!isNaN(width)  ? 1 : width,  10);
    height = parseInt(!isNaN(height) ? 1 : height, 10);
    return this.append('border:color=' + encodeURIComponent(color) + ',width=' + width + ',height=' + height);
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

ImboUrl.prototype.flipHorizontally = function() {
    return this.append('flipHorizontally');
};

ImboUrl.prototype.flipVertically = function() {
    return this.append('flipVertically');
};

ImboUrl.prototype.resize = function(width, height) {
    params = [];

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

ImboUrl.prototype.thumbnail = function(width, height, fit) {
    return this.append('thumbnail:width=' + (width || 50) + ',height=' + (height || 50) + ',fit=' + (fit || 'outbound'));
};

ImboUrl.prototype.reset = function() {
    this.imageIdentifier = this.imageIdentifier.substr(0, 32);
    this.data = [];
};

ImboUrl.prototype.append = function(part) {
    this.data.push(part);
    return this;
};

ImboUrl.prototype.getQueryString = function() {

    if (!this.data.length && this.imageIdentifier.length < 33) {
        // No transformations or custom extensions
        return '';
    }

    // Initialize data for the transformation key hash
    var data = [this.publicKey, this.imageIdentifier];
    var query = '';

    if (this.data.length) {
        // We have some transformations. Generate a transformation key that will be sent to the
        // server so the server can verify if the transformations are valid or not.
        query = 't[]=' + this.data.reduce(function(query, element) {
            return query + '&t[]=' + element;
        });

        data.push(query);
    }

    // Prepare data for the hash
    var transformationKey = crypto.createHmac('md5', this.privateKey).update(data.join('|')).digest('hex');

    if (!query.length) {
        // No query string. Return only the transformation key
        return 'tk=' + transformationKey;
    }

    // Return the query string with the transformation key appended
    return query + '&tk=' + transformationKey;
};

ImboUrl.prototype.getUrl = function() {
    var url = this.baseUrl + '/users/' + this.publicKey + '/images/' + this.imageIdentifier;

    if (!this.data.length) {
        return url;
    }

    return url + '?' + this.getQueryString();
};

ImboUrl.prototype.toString = function() {
    return this.getUrl();
};

exports.Client = ImboClient;