'use strict';

var crypto = require('./node/crypto');

/**
 * Imbo URL helper
 */
var ImboUrl = function(options) {
    options = options || {};

    this.transformations = [];
    this.baseUrl = options.baseUrl;
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
    this.imageIdentifier = options.imageIdentifier || '';
    this.path = options.path || '';
    this.queryString = options.queryString;
};

ImboUrl.prototype.border = function(color, width, height) {
    color  = (color || '000000').replace(/^#/, '');
    width  = parseInt(isNaN(width)  ? 1 : width,  10);
    height = parseInt(isNaN(height) ? 1 : height, 10);
    return this.append('border:color=' + color + ',width=' + width + ',height=' + height);
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

ImboUrl.prototype.desaturate = function() {
    return this.append('desaturate');
};

ImboUrl.prototype.flipHorizontally = function() {
    return this.append('flipHorizontally');
};

ImboUrl.prototype.flipVertically = function() {
    return this.append('flipVertically');
};

ImboUrl.prototype.maxSize = function(width, height) {
    var params = [];

    if (width) {
        params.push('width='  + parseInt(width,  10));
    }

    if (height) {
        params.push('height=' + parseInt(height, 10));
    }

    return this.append('maxSize:' + params.join(','));
};

ImboUrl.prototype.resize = function(width, height) {
    var params = [];

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

ImboUrl.prototype.sepia = function(threshold) {
    threshold = parseInt(threshold, 10);
    return this.append('sepia:threshold=' + (threshold ? threshold : 80));
};

ImboUrl.prototype.thumbnail = function(width, height, fit) {
    return this.append(
        'thumbnail:width=' + (width || 50) +
        ',height=' + (height || 50) +
        ',fit=' + (fit || 'outbound')
    );
};

ImboUrl.prototype.transpose = function() {
    return this.append('transpose');
};

ImboUrl.prototype.transverse = function() {
    return this.append('transverse');
};

ImboUrl.prototype.reset = function() {
    this.imageIdentifier = this.imageIdentifier.substr(0, 32);
    this.transformations = [];
    return this;
};

ImboUrl.prototype.append = function(part) {
    this.transformations.push(encodeURIComponent(part));
    return this;
};

ImboUrl.prototype.getAccessToken = function(url) {
    return crypto.sha256(this.privateKey, url);
};

ImboUrl.prototype.getQueryString = function() {
    var query = this.queryString || '';
    if (this.transformations.length) {
        query += query.length ? '&' : '';
        query += 't[]=' + this.transformations.join('&t[]=');
    }

    return query;
};

ImboUrl.prototype.getUrl = function() {
    var url = this.baseUrl + '/users/' + this.publicKey;
    if (this.imageIdentifier || this.path) {
        url = url + '/images/' + this.imageIdentifier + this.path;
    }

    url = url.replace(/\/+$/, '');

    var qs = this.getQueryString();
    if (qs.length) {
        url += '?' + qs;
    }

    var token = this.getAccessToken(url, this.privateKey);

    return url + (url.indexOf('?') > -1 ? '&' : '?') + 'accessToken=' + token;
};

ImboUrl.prototype.toString = function() {
    return this.getUrl();
};

module.exports = ImboUrl;
