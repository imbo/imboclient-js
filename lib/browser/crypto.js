var hashes  = require('jshashes')
  , readers = require('./readers');

(function(undefined) {
    'use strict';

    module.exports = {
        sha256: function(key, data) {
            var sha256 =  new hashes.SHA256();
            return sha256.hex_hmac(key, data);
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

            // String, then?
            var hasher = new hashes.MD5().setUTF8(!(options && options.binary));
            return setImmediate(callback, undefined, hasher.hex(buffer));
        }
    };

})();
