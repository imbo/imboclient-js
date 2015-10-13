/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view
 * the LICENSE file that was distributed with this source code.
 */
'use strict';

var extend = require('../utils/extend');

/**
 * ShortUrl constructor
 *
 * @param {Object} options
 */
var ShortUrl = function(options) {
    this.baseUrl = options.baseUrl;
    this.shortId = options.id;
};

extend(ShortUrl.prototype, {
    /**
     * Get the ID of the short URL
     *
     * @return {String}
     */
    getId: function() {
        return this.shortId;
    },

    /**
     * Get a string representation of the URL
     *
     * @return {String}
     */
    getUrl: function() {
        return this.baseUrl + '/s/' + this.shortId;
    },

    /**
     * Alias of getUrl()
     *
     * @return {String}
     */
    toString: function() {
        return this.getUrl();
    }
});

module.exports = ShortUrl;
