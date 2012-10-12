var crypto = require('crypto'), undef;

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
    width  = parseInt(isNaN(width)  ? 1 : width,  10);
    height = parseInt(isNaN(height) ? 1 : height, 10);
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

module.exports = ImboUrl;