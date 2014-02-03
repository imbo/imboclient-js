/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var fs = require('fs');

exports.getLengthOfFile = function(file, callback) {
    fs.stat(file, function(err, stats) {
        if (err) {
            return callback(err);
        }

        callback(err, stats.size);
    });
};

exports.createReadStream = fs.createReadStream;
