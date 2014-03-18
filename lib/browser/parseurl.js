/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

/**
 * Parse a URL into parts
 *
 * @param  {String} url
 * @return {Object}
 */
module.exports = function(url) {
    var link = document.createElement('a');
    link.href = url;

    return {
        protocol: link.protocol,
        host: link.host,
        query: link.search.replace(/^\?/, ''),
        pathname: link.pathname
    };
};
