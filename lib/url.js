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

    gif: function() {
        return this.convert('gif');
    },

    jpg: function() {
        return this.convert('jpg');
    },

    png: function() {
        return this.convert('png');
    },

    crop: function(x, y, width, height) {
        return this.append('crop:x=' + x + ',y=' + y + ',width=' + width + ',height=' + height);
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

    resize: function(width, height) {
        var params = [];

        if (width) {
            params.push('width='  + parseInt(width,  10));
        }

        if (height) {
            params.push('height=' + parseInt(height, 10));
        }

        return this.append('resize:' + params.join(','));
    },

    rotate: function(angle, bg) {
        if (isNaN(angle)) {
            return this;
        }

        bg = (bg || '000000').replace(/^#/, '');
        return this.append('rotate:angle=' + angle + ',bg=' + bg);
    },

    sepia: function(threshold) {
        threshold = parseInt(threshold, 10);
        return this.append('sepia:threshold=' + (threshold ? threshold : 80));
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

    reset: function() {
        this.imageIdentifier = this.imageIdentifier.substr(0, 32);
        this.transformations = [];
        return this;
    },

    append: function(part) {
        this.transformations.push(encodeURIComponent(part));
        return this;
    },

    getAccessToken: function(url) {
        return crypto.sha256(this.privateKey, url);
    },

    getQueryString: function() {
        var query = this.queryString || '';
        if (this.transformations.length) {
            query += query.length ? '&' : '';
            query += 't[]=' + this.transformations.join('&t[]=');
        }

        return query;
    },

    getUrl: function() {
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
    },

    toString: function() {
        return this.getUrl();
    }
});

module.exports = ImboUrl;
