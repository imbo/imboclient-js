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
 * Try to parse a string as JSON - on failure, return null
 *
 * @param  {String} str
 * @return {Object|null}
 */
module.exports = function(str) {
    var json;
    try {
        json = JSON.parse(str);
    } catch (e) {
        json = null;
    }

    return json;
};
