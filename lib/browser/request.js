/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var disallowedHeaders = [
    'User-Agent',
    'Content-Length'
];

var normalizeResponse = function(xhr) {
    var res = {
        headers: {},
        statusCode: xhr.status
    };

    var headerPairs = xhr.getAllResponseHeaders().split('\u000d\u000a');
    for (var i = 0; i < headerPairs.length; i++) {
        var headerPair = headerPairs[i]
          , index      = headerPair.indexOf('\u003a\u0020');

        if (index > 0) {
            var key = headerPair.substring(0, index);
            var val = headerPair.substring(index + 2);
            res.headers[key.toLowerCase()] = val;
        }
    }

    return res;
};

module.exports = function(options) {
    // Prepare options
    options.method = options.method.toUpperCase();
    options.uri    = options.uri.toString();

    // Instantiate request
    var xhr = new XMLHttpRequest();

    // Request finished handler
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status !== 0 && options.onComplete) {
            options.onComplete(
                (xhr.status >= 400) ? (xhr.status + ' ' + xhr.statusText) : undefined,
                normalizeResponse(xhr),
                options.json ? JSON.parse(xhr.responseText) : xhr.responseText
            );
        }
    };

    // Request failure handler
    xhr.onerror = function() {
        options.onComplete('XHR error - CORS denied?', normalizeResponse(xhr));
    };

    // Request progress handler
    if (options.onProgress) {
        xhr.upload.addEventListener('progress', options.onProgress, false);
    }

    // Open the request
    xhr.open(options.method, options.uri, true);

    // Apply request headers
    for (var key in options.headers) {
        // We're not allowed to set certain headers in browsers
        if (disallowedHeaders.indexOf(key) > -1) {
            continue;
        }

        xhr.setRequestHeader(key, options.headers[key]);
    }

    // Is this a JSON-request?
    if (options.json && typeof options.json !== 'boolean') {
        xhr.setRequestHeader('Content-Type', 'application/json');
        options.body = JSON.stringify(options.json);
    }

    // Send the request
    xhr.send(options.body);
};
