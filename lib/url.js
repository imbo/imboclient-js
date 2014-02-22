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

// Simple function wrappers for better readability and compression
var toInt = function(num) { return parseInt(num, 10); },
    isNumeric = function(num) { return !isNaN(num); };

extend(ImboUrl.prototype, {
    autoRotate: function() {
        return this.append('autoRotate');
    },

    border: function(options) {
        options = options || {};

        var params = [
            'color='  + (options.color  || '000000').replace(/^#/, ''),
            'width='  + toInt(options.width  || 1),
            'height=' + toInt(options.height || 1),
            'mode='   + (options.mode   || 'outbound')
        ];

        return this.append('border:' + params.join(','));
    },

    canvas: function(options) {
        options = options || {};

        if (!options.width || !options.height) {
            throw new Error('width and height must be specified');
        }

        var params = [
            'width='  + toInt(options.width),
            'height=' + toInt(options.height),
        ];

        if (options.mode) {
            params.push('mode=' + options.mode);
        }

        if (options.x) {
            params.push('x=' + toInt(options.x));
        }

        if (options.y) {
            params.push('y=' + toInt(options.y));
        }

        if (options.bg) {
            params.push('bg=' + options.bg.replace(/^#/, ''));
        }

        return this.append('canvas:' + params.join(','));
    },

    compress: function(options) {
        var level = (options || {}).level || options;
        return this.append('compress:level=' + (isNumeric(level) ? level : 75));
    },

    convert: function(type) {
        this.imageIdentifier = this.imageIdentifier.substr(0, 32) + '.' + type;
        return this;
    },

    crop: function(options) {
        var opts   = options || {},
            mode   = opts.mode,
            x      = opts.x,
            y      = opts.y,
            width  = opts.width,
            height = opts.height;

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
            'width='  + toInt(width),
            'height=' + toInt(height),
        ];

        if (isNumeric(x)) {
            params.push('x=' + toInt(x));
        }

        if (isNumeric(y)) {
            params.push('y=' + toInt(y));
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

    maxSize: function(options) {
        var params = [],
            opts   = options || {};

        if (opts.width) {
            params.push('width='  + toInt(opts.width));
        }

        if (opts.height) {
            params.push('height=' + toInt(opts.height));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('maxSize:' + params.join(','));
    },

    modulate: function(options) {
        var params = [],
            opts   = options || {};

        if (isNumeric(opts.brightness)) {
            params.push('b=' + opts.brightness);
        }

        if (isNumeric(opts.saturation)) {
            params.push('s=' + opts.saturation);
        }

        if (isNumeric(opts.hue)) {
            params.push('h=' + opts.hue);
        }

        if (!params.length) {
            throw new Error('brightness, saturation or hue needs to be specified');
        }

        return this.append('modulate:' + params.join(','));
    },

    progressive: function() {
        return this.append('progressive');
    },

    resize: function(options) {
        var params = [],
            opts   = options || {};

        if (opts.width) {
            params.push('width='  + toInt(opts.width));
        }

        if (opts.height) {
            params.push('height=' + toInt(opts.height));
        }

        if (!params.length) {
            throw new Error('width and/or height needs to be specified');
        }

        return this.append('resize:' + params.join(','));
    },

    rotate: function(options) {
        var opts = options || {};

        if (isNaN(opts.angle)) {
            throw new Error('angle needs to be specified');
        }

        var bg = (opts.bg || '000000').replace(/^#/, '');
        return this.append('rotate:angle=' + opts.angle + ',bg=' + bg);
    },

    sepia: function(options) {
        var threshold = (options || {}).threshold || options;
        return this.append('sepia:threshold=' + (isNumeric(threshold) ? threshold : 80));
    },

    strip: function() {
        return this.append('strip');
    },

    thumbnail: function(options) {
        options = options || {};

        return this.append(
            'thumbnail:width=' + (options.width || 50) +
            ',height=' + (options.height || 50) +
            ',fit=' + (options.fit || 'outbound')
        );
    },

    transpose: function() {
        return this.append('transpose');
    },

    transverse: function() {
        return this.append('transverse');
    },

    watermark: function(options) {
        options = options || {};

        var params = [
            'position=' + (options.position || 'top-left'),
            'x=' + toInt(options.x || 0),
            'y=' + toInt(options.y || 0)
        ];

        if (options.imageIdentifier) {
            params.push('img=' + options.imageIdentifier);
        }

        if (options.width > 0) {
            params.push('width=' + toInt(options.width));
        }

        if (options.height > 0) {
            params.push('height=' + toInt(options.height));
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
