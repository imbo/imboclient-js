/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var extend = require('../utils/extend');

// Headers which browsers block you from setting
var disallowedHeaders = [
    'User-Agent',
    'Content-Length'
];

/**
 * Normalize a response into a common format for both environments
 *
 * @param  {XMLHttpRequest} xhr
 * @return {Object}
 */
var normalizeResponse = function(xhr) {
    var response = {
        headers: {},
        statusCode: xhr.status
    };

    var headerPairs = xhr.getAllResponseHeaders().split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i],
            index = headerPair.indexOf('\u003a\u0020');

        if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            response.headers[key.toLowerCase()] = val;
        }
    }

    return response;
};

/**
 * Send an HTTP request with the given options
 *
 * @param {Object} options
 */
function request(options) {
    // Prepare options
    var opts = extend({}, options);
    opts.method = opts.method.toUpperCase();
    opts.uri = opts.uri.toString();

    // Instantiate request
    var xhr = new XMLHttpRequest();

    // Request finished handler
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status !== 0 && opts.onComplete) {
            var err = null;
            if (xhr.status >= 400) {
                err = new Error('HTTP ' + xhr.status + ' ' + xhr.statusText);
                err.statusCode = xhr.status;
            }

            opts.onComplete(
                err,
                normalizeResponse(xhr),
                opts.json ? JSON.parse(xhr.responseText) : xhr.responseText
            );
        }
    };

    // Request failure handler
    xhr.onerror = function() {
        opts.onComplete(new Error('XHR error - CORS denied?'), normalizeResponse(xhr));
    };

    // Request progress handler
    if (opts.onProgress) {
        xhr.upload.addEventListener('progress', opts.onProgress, false);
    }

    // Open the request
    xhr.open(opts.method, opts.uri, true);

    // Apply request headers
    for (var key in opts.headers) {
        // We're not allowed to set certain headers in browsers
        if (disallowedHeaders.indexOf(key) > -1) {
            continue;
        }

        xhr.setRequestHeader(key, opts.headers[key]);
    }

    // Is this a JSON-request?
    if (opts.json) {
        xhr.setRequestHeader('Accept', 'application/json');

        // Do we have a payload to deliver as JSON?
        if (typeof opts.json !== 'boolean') {
            xhr.setRequestHeader('Content-Type', 'application/json');
            opts.body = JSON.stringify(opts.json);
        }
    }

    // Send the request
    xhr.send(opts.body);
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
