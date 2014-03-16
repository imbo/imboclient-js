/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var fs      = require('fs'),
    request = require('./request');

/**
 * Get length of a file
 *
 * @param  {String}   file - Path to file
 * @param  {Function} callback
 */
exports.getLengthOfFile = function(file, callback) {
    fs.stat(file, function(err, stats) {
        if (err) {
            return callback(err);
        }

        callback(err, stats.size);
    });
};

/**
 * Get binary contents from a URL
 *
 * @param  {String}   url
 * @param  {Function} callback
 */
exports.getContentsFromUrl = function(url, callback) {
    request({
        method    : 'GET',
        uri       : url,
        encoding  : null,
        onComplete: callback
    });
};

/**
 * Returns a new ReadStream object
 *
 * @param {String} path
 * @param {Object} [options]
 * @return {ReadStream}
 */
exports.createReadStream = fs.createReadStream;
