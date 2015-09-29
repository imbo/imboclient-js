'use strict';

/**
 * Parse an array of URLs, stripping excessive parts
 *
 * @param  {String|Array} urls
 * @return {Array}
 */
module.exports = function parseUrls(urls) {
    // Accept string for host, if user only specifies one
    if (typeof urls === 'string') {
        urls = [urls];
    } else if (!Array.isArray(urls) || !urls.length) {
        throw new Error('`options.hosts` must be a string or an array of strings');
    }

    // Strip out any unnecessary parts
    var serverUrls = [];
    for (var i = 0; i < urls.length; i++) {
        serverUrls.push(urls[i].replace(/:80(\/|$)/, '$1').replace(/\/$/, ''));
    }

    return serverUrls;
};
