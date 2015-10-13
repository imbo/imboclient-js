/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var req = require('request'),
    extend = require('../utils/extend');

/**
 * Send an HTTP request with the given options
 *
 * @param {Object} options
 * @return {Request}
 */
function request(options) {
    // Prepare options
    var opts = extend({}, options);
    opts.method = (opts.method || 'GET').toUpperCase();
    opts.uri = opts.uri.toString();

    if (!opts.onComplete) {
        return req(opts);
    }

    return req(opts, function(err, res, body) {
        if (err || res.statusCode >= 400) {
            err = err || new Error('HTTP ' + res.statusCode + ' ' + res.statusMessage);

            if (res) {
                err.statusCode = res.statusCode;
            }

            return opts.onComplete(err, res, body);
        }

        return opts.onComplete(null, res, body);
    });
}

/**
 * Shorthand method for sending requests
 *
 * @param  {String}   method
 * @param  {String}   url
 * @param  {Function} callback
 */
request.short = function(method, url, callback) {
    var options = { method: method, uri: url, onComplete: callback };

    if (method === 'GET') {
        options.json = true;
    }

    request(options);
};

/**
 * Shorthand method for sending GET-requests
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
request.get = function(url, callback) {
    request.short('GET', url, callback);
};

/**
 * Shorthand method for sending DELETE-requests
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
request.del = function(url, callback) {
    request.short('DELETE', url, callback);
};

/**
 * Shorthand method for sending HEAD-requests
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
request.head = function(url, callback) {
    request.short('HEAD', url, callback);
};

module.exports = request;
