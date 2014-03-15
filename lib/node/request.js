/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var req = require('request');

/**
 * Send an HTTP request with the given options
 *
 * @param {Object} options
 */
function request(options) {
    // Prepare options
    options.method = (options.method || 'GET').toUpperCase();
    options.uri    = options.uri.toString();

    // Do we have any callback, or is this a fire-and-forgot request?
    var hasCallback = !!options.onComplete;

    // Run the request
    return req(options, hasCallback ? function(err, res, body) {
        if (err) {
            var error = err.code === 'ENOTFOUND' ? 404 : err;
            return options.onComplete(error, res, body);
        } else if (res.statusCode >= 400) {
            return options.onComplete(res.statusCode, res, body);
        }

        return options.onComplete(err, res, body);
    } : undefined);
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
