// Moo.
var util    = require('util')
  , request = require('request')
  , crypto  = require('crypto');

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

ImboClient.prototype.addImage = function() {

};

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

ImboClient.prototype.getImageIdentifier = function(imgPath) {
    return imgPath;
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

exports.Client = ImboClient;