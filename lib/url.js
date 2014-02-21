/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var crypto = require('./node/crypto'),
    extend = require('./utils/extend');

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

extend(ImboUrl.prototype, {
    autoRotate: function() {
        return this.append('autoRotate');
    },

    border: function(color, width, height) {
        color  = (color || '000000').replace(/^#/, '');
        width  = parseInt(isNaN(width)  ? 1 : width,  10);
        height = parseInt(isNaN(height) ? 1 : height, 10);
        return this.append('border:color=' + color + ',width=' + width + ',height=' + height);
    },

    canvas: function(width, height, mode, x, y, bg) {
        var params = [
            'width=' + parseInt(width, 10),
            'height=' + parseInt(height, 10),
        ];

        if (mode) {
            params.push('mode=' + mode);
        }

        if (x) {
            params.push('x=' + parseInt(x, 10));
        }

        if (y) {
            params.push('y=' + parseInt(y, 10));
        }

        if (bg) {
            params.push('bg=' + bg.replace(/^#/, ''));
        }

        return this.append('canvas:' + params.join(','));
    },

    compress: function(level) {
        level = parseInt(level, 10);
        return this.append('compress:level=' + (level ? level : 75));
    },

    convert: function(type) {
        this.imageIdentifier  = this.imageIdentifier.substr(0, 32) + '.' + type;
        return this;
    },

    crop: function(x, y, width, height, mode) {
        if (!mode && (isNaN(x) || isNaN(y))) {
            throw new Error('x and y needs to be specified without a crop mode');
        }

        if (mode === 'center-x' && isNaN(y)) {
            throw new Error('y needs to be specified when mode is center-x');
        } else if (mode === 'center-y' && isNaN(x)) {
            throw new Error('x needs to be specified when mode is center-y');
        } else if (isNaN(width) || isNaN(height)) {
            throw new Error('width and height needs to be specified');
        }

        var params = [
            'width='  + parseInt(width,  10),
            'height=' + parseInt(height, 10),
        ];

        if (!isNaN(x)) {
            params.push('x=' + parseInt(x, 10));
        }

        if (!isNaN(y)) {
            params.push('y=' + parseInt(y, 10));
        }

        if (mode) {
            params.push('mode=' + mode);
        }

        return this.append('crop:' + params.join(','));
    },

    desaturate: function() {
        return this.append('desaturate');
    },

    flipHorizontally: function() {
        return this.append('flipHorizontally');
    },

    flipVertically: function() {
        return this.append('flipVertically');
    },

    maxSize: function(width, height) {
        var params = [];

        if (width) {
            params.push('width='  + parseInt(width,  10));
        }

        if (height) {
            params.push('height=' + parseInt(height, 10));
        }

        return this.append('maxSize:' + params.join(','));
    },

    modulate: function(brightness, saturation, hue) {
        var params = [];

        if (brightness !== null) {
            params.push('b=' + brightness);
        }

        if (saturation !== null && saturation !== undefined) {
            params.push('s=' + saturation);
        }

        if (hue !== null && hue !== undefined) {
            params.push('h=' + hue);
        }

        return this.append('modulate:' + params.join(','));
    },

    progressive: function() {
        return this.append('progressive');
    },

    resize: function(width, height) {
        var params = [];

        if (width) {
            params.push('width='  + parseInt(width,  10));
        }

        if (height) {
            params.push('height=' + parseInt(height, 10));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('resize:' + params.join(','));
    },

    rotate: function(angle, bg) {
        if (isNaN(angle)) {
            throw new Error('angle needs to be specified');
        }

        bg = (bg || '000000').replace(/^#/, '');
        return this.append('rotate:angle=' + angle + ',bg=' + bg);
    },

    sepia: function(threshold) {
        threshold = parseInt(threshold, 10);
        return this.append('sepia:threshold=' + (threshold || 80));
    },

    strip: function() {
        return this.append('strip');
    },

    thumbnail: function(width, height, fit) {
        return this.append(
            'thumbnail:width=' + (width || 50) +
            ',height=' + (height || 50) +
            ',fit=' + (fit || 'outbound')
        );
    },

    transpose: function() {
        return this.append('transpose');
    },

    transverse: function() {
        return this.append('transverse');
    },

    watermark: function(imageIdentifier, width, height, position, x, y) {
        var params = [
            'position=' + (position || 'top-left'),
            'x=' + (x || 0),
            'y=' + (y || 0)
        ];

        if (imageIdentifier) {
            params.push('img=' + imageIdentifier);
        }

        if (width > 0) {
            params.push('width=' + width);
        }

        if (height > 0) {
            params.push('height=' + height);
        }

        return this.append('watermark:' + params.join(','));
    },

    gif: function() {
        return this.convert('gif');
    },

    jpg: function() {
        return this.convert('jpg');
    },

    png: function() {
        return this.convert('png');
    },

    reset: function() {
        this.imageIdentifier = this.imageIdentifier.substr(0, 32);
        this.transformations = [];
        return this;
    },

    append: function(transformation) {
        this.transformations.push(transformation);
        return this;
    },

    getTransformations: function() {
        return this.transformations;
    },

    getAccessToken: function(url) {
        return crypto.sha256(this.privateKey, url);
    },

    getQueryString: function(encode) {
        var query             = this.queryString || '',
            transformations   = this.transformations,
            transformationKey = encode ? 't%5B%5D=' : 't[]=';

        if (encode) {
            transformations = transformations.map(encodeURIComponent);
        }

        if (this.transformations.length) {
            query += query.length ? '&' : '';
            query += transformationKey + transformations.join('&' + transformationKey);
        }

        return query;
    },

    getUrl: function() {
        var url = this.baseUrl + '/users/' + this.publicKey;
        if (this.imageIdentifier || this.path) {
            url = url + '/images/' + this.imageIdentifier + this.path;
        }

        url = url.replace(/\/+$/, '');

        var encodedUrl = url;
        var qs = this.getQueryString();
        if (qs.length) {
            encodedUrl += '?' + this.getQueryString(true);
            url        += '?' + qs;
        }

        var token = this.getAccessToken(url, this.privateKey);

        return encodedUrl + (url.indexOf('?') > -1 ? '&' : '?') + 'accessToken=' + token;
    },

    toString: function() {
        return this.getUrl();
    }
});

module.exports = ImboUrl;
