var crypto = require('crypto'), undef;

/**
 * Imbo URL helper
 */
function ImboUrl(baseUrl, publicKey, privateKey, imageIdentifier, path) {
    this.transformations = [];
    this.baseUrl = baseUrl;
    this.publicKey = publicKey;
    this.imageIdentifier = imageIdentifier;
    this.privateKey = privateKey;
    this.path = path || '';
}

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

ImboUrl.prototype.thumbnail = function(width, height, fit) {
    return this.append('thumbnail:width=' + (width || 50) + ',height=' + (height || 50) + ',fit=' + (fit || 'outbound'));
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
    return crypto.createHmac('sha256', this.privateKey).update(url).digest('hex');
};

ImboUrl.prototype.getQueryString = function() {
    var query = '';
    if (this.transformations.length) {
        // We have some transformations. Generate a transformation key that will be sent to the
        // server so the server can verify if the transformations are valid or not.
        query = 't[]=' + this.transformations.reduce(function(query, element) {
            return query + '&t[]=' + element;
        });
    }

    return query;
};

ImboUrl.prototype.getUrl = function() {
    var url   = this.baseUrl + '/users/' + this.publicKey + '/images/' + this.imageIdentifier + this.path;
    var qs    = this.getQueryString();
    if (qs.length) {
        url += '?' + qs;
    }

    var token = this.getAccessToken(url, this.privateKey);

    return url + (qs.length ? '&' : '?') + 'accessToken=' + token;
};

ImboUrl.prototype.toString = function() {
    return this.getUrl();
};

module.exports = ImboUrl;