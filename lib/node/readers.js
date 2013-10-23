/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var fs      = require('fs')
  , request = require('./request');

exports.getContentsFromFile = function(file, callback) {
    fs.readFile(file, function(err, body) {
        if (err) {
            return callback(err);
        }

        callback(err, body);
    });
};

exports.getContentsFromUrl = function(url, callback) {
    request({
        method    : 'GET',
        uri       : url,
        encoding  : null,
        onComplete: callback
    });
};
