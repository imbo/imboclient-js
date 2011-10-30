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

exports.Client = ImboClient;