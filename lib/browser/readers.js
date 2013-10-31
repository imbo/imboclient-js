/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

exports.getContentsFromFile = function(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        return callback(undefined, e.target.result);
    };
    reader.readAsArrayBuffer(file);
};

exports.getContentsFromUrl = function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            callback(undefined, xhr.responseText);
        }
    };
    xhr.send(null);
};
