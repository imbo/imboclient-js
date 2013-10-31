/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var sha     = require('./sha')
  , md5     = require('./md5')
  , readers = require('./readers');

module.exports = {
    sha256: function(key, data) {
        return sha.sha256hmac(key, data);
    },

    md5: function(buffer, callback, options) {
        // URL?
        if (options && options.type === 'url') {
            return readers.getContentsFromUrl(buffer, function(err, data) {
                module.exports.md5(data, callback, { binary: true });
            });
        }

        // File instance?
        if (buffer instanceof window.File) {
            return readers.getContentsFromFile(buffer, function(err, data) {
                module.exports.md5(data, callback, { binary: true });
            });
        }

        // ArrayBuffer, then.
        return setImmediate(callback, undefined, md5.ArrayBuffer.hash(buffer));
    }
};