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
 * ImboUrl constructor
 *
 * @param {Object} options
 */
var ImboUrl = function(options) {
    options = options || {};

    this.transformations = [];
    this.baseUrl = options.baseUrl;
    this.publicKey = options.publicKey;
    this.privateKey = options.privateKey;
    this.extension = options.extension || '';
    this.imageIdentifier = options.imageIdentifier || '';
    this.path = options.path || '';
    this.queryString = options.queryString;
};

extend(ImboUrl.prototype, {
    /**
     * Get the path part of the URL
     *
     * @return {String}
     */
    getPath: function() {
        return this.path;
    },

    /**
     * Set the path part of the URL
     *
     * @param  {String} path
     * @return {Imbo.Url}
     */
    setPath: function(path) {
        this.path = path;
        return this;
    },

    /**
     * Generate access token for the passed URL
     *
     * @param  {String} url
     * @return {String}
     */
    getAccessToken: function(url) {
        return crypto.sha256(this.privateKey, url);
    },

    /**
     * Set the query string for the URL
     *
     * @param  {String} qs
     * @return {Imbo.Url}
     */
    setQueryString: function(qs) {
        this.queryString = qs;
        return this;
    },

    /**
     * Get the query string of the URL
     *
     * @return {String}
     */
    getQueryString: function() {
        return this.queryString || '';
    },

    /**
     * Get a string representation of the URL
     *
     * @return {String}
     */
    getUrl: function() {
        var url        = (this.baseUrl + this.extension + this.path),
            encodedUrl = url,
            qs         = this.getQueryString();

        if (qs.length) {
            encodedUrl += '?' + this.getQueryString(true);
            url        += '?' + qs;
        }

        return [
            encodedUrl,
            (url.indexOf('?') > -1 ? '&' : '?'),
            'accessToken=' + this.getAccessToken(url, this.privateKey)
        ].join('');
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

module.exports = ImboUrl;
