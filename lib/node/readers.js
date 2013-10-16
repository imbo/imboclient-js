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
