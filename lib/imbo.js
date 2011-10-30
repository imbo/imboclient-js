// Moo.
var util    = require('util')
  , request = require('request')
  , crypto  = require('crypto')
  , fs      = require('fs');

function ImboClient(options) {

    this.options = {
        host:       null,
        publicKey:  null,
        privateKey: null
    };

    // Merge passed options with defaults
    for (var key in options) {
        this.options[key] = options[key];
    }
}

/**
 * Image operations
 */
ImboClient.prototype.addImage = function(imgPath, callback) {
    var self = this;

    self.getImageIdentifier(imgPath, function(imageIdentifier) {
        var url = self.getSignedResourceUrl('PUT', imageIdentifier);
        fs.ReadStream(imgPath).pipe(request.put(url, callback));
    });
};

ImboClient.prototype.deleteImage = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', imageIdentifier);
    request.del({
        uri: url,
        json: true
    }, callback);
};

ImboClient.prototype.headImage = function(imageIdentifier, callback) {
    var url = this.getResourceUrl(imageIdentifier);
    request.head({
        uri: url
    }, callback);
};

ImboClient.prototype.imageExists = function(imgPath, callback) {
    var self = this;
    self.getImageIdentifier(imgPath, function(imageIdentifier) {
        self.headImage(imageIdentifier, function(err, res) {
            callback(res.statusCode == 200);
        });
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
}

ImboClient.prototype.editMetadata = function(imageIdentifier, data, callback) {
    var url = this.getSignedResourceUrl('POST', imageIdentifier + '/meta');
    request.post({
        uri: url,
        json: data
    }, callback);
};

ImboClient.prototype.deleteMetadata = function(imageIdentifier, callback) {
    var url = this.getSignedResourceUrl('DELETE', imageIdentifier + '/meta');
    request.del({
        uri: url,
        json: true
    }, callback);
};

/**
 * Base/core methods
 */
ImboClient.prototype.getImageIdentifier = function(imgPath, callback) {
    md5file(imgPath, callback);
};

ImboClient.prototype.getImageUrl = function(imageIdentifier) {
    return new ImboUrl(this.options.host, this.options.publicKey, imageIdentifier);
};

ImboClient.prototype.getResourceUrl = function(resourceIdentifier) {
    return this.options.host + '/users/' + this.options.publicKey + '/images/' + resourceIdentifier;
};

ImboClient.prototype.getSignedResourceUrl = function(method, resourceIdentifier) {
    var timestamp = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    var signature = this.generateSignature(method, resourceIdentifier, timestamp);

    var qs = '';
    qs += '?signature=' + encodeURIComponent(signature);
    qs += '&timestamp=' + encodeURIComponent(timestamp);

    return this.getResourceUrl(resourceIdentifier) + qs;
};

ImboClient.prototype.generateSignature = function(method, resourceIdentifier, timestamp) {
    var data = [method, resourceIdentifier, this.options.publicKey, timestamp].join('|');

    // Generate signature
    var signature = crypto.createHmac('sha256', this.options.privateKey).update(data).digest('hex');

    return signature;
};

/**
 * Utility methods
 */
function md5file(filename, callback) {
    var md5 = crypto.createHash('md5');
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
function ImboUrl(baseUrl, publicKey, imageIdentifier) {
    this.data = [];
    this.baseUrl = baseUrl;
    this.publicKey = publicKey;
    this.imageIdentifier = imageIdentifier;
};

ImboUrl.prototype.border = function(color, width, height) {
    color  = (color || '000000').replace(/^#/, '');
    width  = parseInt(!isNaN(width)  ? 1 : width,  10);
    height = parseInt(!isNaN(height) ? 1 : height, 10);
    return this.append('border:color=' + encodeURIComponent(color) + ',width=' + width + ',height=' + height);
}

ImboUrl.prototype.compress = function(quality) {
    quality = parseInt(quality, 10);
    return this.append('compress:quality=' + (quality ? quality : 75));
}

ImboUrl.prototype.convert = function(type) {
    this.imageIdentifier  = this.imageIdentifier.substr(0, 32) + '.' + type;
    return this;
}

ImboUrl.prototype.gif = function() {
    return this.convert('gif');
}

ImboUrl.prototype.jpg = function() {
    return this.convert('jpg');
}

ImboUrl.prototype.png = function() {
    return this.convert('png');
}

ImboUrl.prototype.crop = function(x, y, width, height) {
    return this.append('crop:x=' + x + ',y=' + y + ',width=' + width + ',height=' + height);
}

ImboUrl.prototype.flipHorizontally = function() {
    return this.append('flipHorizontally');
}

ImboUrl.prototype.flipVertically = function() {
    return this.append('flipVertically');
}

ImboUrl.prototype.resize = function(width, height) {
    params = [];

    if (width) {
        params.push('width='  + parseInt(width,  10));
    }

    if (height) {
        params.push('height=' + parseInt(height, 10));
    }

    return this.append('resize:' + params.join(','));
}

ImboUrl.prototype.rotate = function(angle, bg) {
    if (isNaN(angle)) {
        return this;
    }

    bg = (bg || '000000').replace(/^#/, '');
    return this.append('rotate:angle=' + angle + ',bg=' + bg);
}

ImboUrl.prototype.thumbnail = function(width, height, fit) {
    return this.append('thumbnail:width=' + (width || 50) + ',height=' + (height || 50) + ',fit=' + (fit || 'outbound'));
}

ImboUrl.prototype.reset = function() {
    this.imageIdentifier = this.imageIdentifier.substr(0, 32);
    this.data = [];
};

ImboUrl.prototype.append = function(part) {
    this.data.push(part);
    return this;
};

ImboUrl.prototype.getQueryString = function() {
    var query = this.data.reduce(function(query, element) {
        return query + '&t[]=' + element;
    });

    return query;
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