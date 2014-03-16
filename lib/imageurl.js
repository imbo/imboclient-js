/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */
'use strict';

var ImboUrl = require('./url'),
    extend  = require('./utils/extend');

// Simple function wrappers for better readability and compression
var toInt = function(num) { return parseInt(num, 10); },
    isNumeric = function(num) { return !isNaN(num); };

/**
 * ImageUrl constructor
 *
 * @param {Object} options
 */
var ImageUrl = function(options) {
    options = options || {};

    this.transformations = [];
    this.baseUrl = options.baseUrl;
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
    this.imageIdentifier = options.imageIdentifier || '';
    this.extension = '';
    this.queryString = options.queryString;
    this.path = options.path || '';

    this.baseUrl += [
        '/users', this.publicKey,
        'images', this.imageIdentifier
    ].join('/');
};

extend(ImageUrl.prototype, ImboUrl.prototype);
extend(ImageUrl.prototype, {
    /**
     * Auto-rotate an image based on EXIF-data
     *
     * @return {Imbo.ImageUrl}
     */
    autoRotate: function() {
        return this.append('autoRotate');
    },

    /**
     * Add a border to the image
     *
     * @param  {Object} [options={}]
     * @param  {String} [options.color=000000]  Color of the border (in hex-format)
     * @param  {Number} [options.width=1]       Width of the left and right borders
     * @param  {Number} [options.height=1]      Height of the top and bottom borders
     * @param  {String} [options.mode=outbound] Mode of the border, "inline" or "outbound"
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Puts the image inside a canvas
     *
     * @param  {Object} options
     * @param  {Number} options.width  Width of the canvas
     * @param  {Number} options.height Height of the canvas
     * @param  {String} [options.mode] Placement mode: "free", "center", "center-x" or "center-y"
     * @param  {Number} [options.x]    X coordinate of the placement of the upper left corner of the existing image
     * @param  {Number} [options.y]    Y coordinate of the placement of the upper left corner of the existing image
     * @param  {String} [options.bg]   Background color of the canvas, in hex-format
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Compress the image
     *
     * @param  {Object} [options={}]
     * @param  {Number} [options.level=75] Compression level (0 - 100)
     * @return {Imbo.ImageUrl}
     */
    compress: function(options) {
        var level = (options || {}).level || options;
        return this.append('compress:level=' + (isNumeric(level) ? level : 75));
    },

    /**
     * Convert the image to the given file type
     *
     * @param  {String} type File extension ("jpg", "gif", "png")
     * @return {Imbo.ImageUrl}
     */
    convert: function(type) {
        this.extension = '.' + type;
        return this;
    },

    /**
     * Crops the image using specified parameters
     *
     * @param  {Object} options
     * @param  {String} [options.mode] Crop mode: "center-x" or "center-y" (available in Imbo >= 1.1.0)
     * @param  {Number} [options.x]    X coordinate of the top left corner of the crop
     * @param  {Number} [options.y]    Y coordinate of the top left corner of the crop
     * @param  {Number} options.width  Width of the crop
     * @param  {Number} options.height Height of the crop
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Desaturate the image
     *
     * @return {Imbo.ImageUrl}
     */
    desaturate: function() {
        return this.append('desaturate');
    },

    /**
     * Flip the image horizontally
     *
     * @return {Imbo.ImageUrl}
     */
    flipHorizontally: function() {
        return this.append('flipHorizontally');
    },

    /**
     * Flip the image vertically
     *
     * @return {Imbo.ImageUrl}
     */
    flipVertically: function() {
        return this.append('flipVertically');
    },

    /**
     * Resize the image to be at most the size specified while still preserving
     * the aspect ratio. If the image is smaller than the given size, the image
     * remains unchanged
     *
     * @param  {Object} options
     * @param  {Number} [options.width]  Max width of the image
     * @param  {Number} [options.height] Max height of the image
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Modulate the image by altering the brightness, saturation and/or hue
     *
     * @param  {Object} options
     * @param  {Number} [options.brightness=100] Brightness level
     * @param  {Number} [options.saturation=100] Saturation level
     * @param  {Number} [options.hue=100]        Hue level
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Set the progressive rendering flag on the image
     *
     * @return {Imbo.ImageUrl}
     */
    progressive: function() {
        return this.append('progressive');
    },

    /**
     * Resize the image to the given size. If only one dimension is specified,
     * the image will be resized while keeping it's aspect ratio
     *
     * @param  {Object} options
     * @param  {Object} [options.width]  New width of the image
     * @param  {Object} [options.height] new height of the image
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Rotate the image by the specified angle
     *
     * @param  {Object} options
     * @param  {Number} options.angle Angle to rotate by
     * @param  {String} [options.bg]  Background color of image, in hex-format
     * @return {Imbo.ImageUrl}
     */
    rotate: function(options) {
        var opts = options || {};

        if (isNaN(opts.angle)) {
            throw new Error('angle needs to be specified');
        }

        var bg = (opts.bg || '000000').replace(/^#/, '');
        return this.append('rotate:angle=' + opts.angle + ',bg=' + bg);
    },

    /**
     * Add a sepia effect to the image
     *
     * @param  {Object} [options]
     * @param  {Number} [options.threshold=80] Extent of sepia toning
     * @return {Imbo.ImageUrl}
     */
    sepia: function(options) {
        var threshold = (options || {}).threshold || options;
        return this.append('sepia:threshold=' + (isNumeric(threshold) ? threshold : 80));
    },

    /**
     * Strip the image of all properties and comments (EXIF-data and such)
     *
     * @return {Imbo.ImageUrl}
     */
    strip: function() {
        return this.append('strip');
    },

    /**
     * Create a thumbnailed version of the image
     *
     * @param  {Object} [options]
     * @param  {Number} [options.width=50]     Width of the thumbnail
     * @param  {Number} [options.height=50]    Height of the thumbnail
     * @param  {String} [options.fit=outbound] Fit mode: "outbound" or "inset"
     * @return {Imbo.ImageUrl}
     */
    thumbnail: function(options) {
        options = options || {};

        return this.append(
            'thumbnail:width=' + (options.width || 50) +
            ',height=' + (options.height || 50) +
            ',fit=' + (options.fit || 'outbound')
        );
    },

    /**
     * Transposes the image
     *
     * @return {Imbo.ImageUrl}
     */
    transpose: function() {
        return this.append('transpose');
    },

    /**
     * Transverse the image
     *
     * @return {Imbo.ImageUrl}
     */
    transverse: function() {
        return this.append('transverse');
    },

    /**
     * Applies a watermark on top of the original image
     *
     * @param  {Object} [options]
     * @param  {Number} [options.img] Image identifier of the image to apply as watermark
     * @param  {Number} [options.width]  Width of the watermark, in pixels
     * @param  {Number} [options.height] Height of the watermark, in pixels
     * @param  {String} [options.position=top-left] Position of the watermark. Values: "top-left", "top-right", "bottom-left", "bottom-right" and "center"
     * @param  {Number} [options.x] Number of pixels in the X-axis the watermark image should be offset from the original position
     * @param  {Number} [options.y] Number of pixels in the Y-axis the watermark image should be offset from the original position
     * @return {Imbo.ImageUrl}
     */
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

    /**
     * Specifies the output format as gif
     *
     * @return {Imbo.ImageUrl}
     */
    gif: function() {
        return this.convert('gif');
    },

    /**
     * Specifies the output format as jpg
     *
     * @return {Imbo.ImageUrl}
     */
    jpg: function() {
        return this.convert('jpg');
    },

    /**
     * Specifies the output format as png
     *
     * @return {Imbo.ImageUrl}
     */
    png: function() {
        return this.convert('png');
    },

    /**
     * Reset the image to original state by removing applied transformations
     *
     * @return {Imbo.ImageUrl}
     */
    reset: function() {
        this.extension = '';
        this.transformations = [];
        return this;
    },

    /**
     * Appends a transformation to the chain
     *
     * @param  {String} transformation A transformation to be applied
     * @return {Imbo.ImageUrl}
     */
    append: function(transformation) {
        this.transformations.push(transformation);
        return this;
    },

    /**
     * Get array of all applied transformations (in the order they were added)
     *
     * @return {Array}
     */
    getTransformations: function() {
        return this.transformations;
    },

    /**
     * Get the query string with all transformations applied
     *
     * @param  {Boolean} [encode=false]
     * @return {String}
     */
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
    }
});

module.exports = ImageUrl;
