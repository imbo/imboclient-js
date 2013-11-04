/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var supportsWebWorkers = function() {
    if (typeof window.Worker === 'undefined' || typeof window.URL === 'undefined') {
        return false;
    }

    try {
        new Worker(window.URL.createObjectURL(new Blob([''], { type:'text/javascript' })));
    } catch (e) {
        return false;
    }

    return true;
};

var sha     = require('./sha')
  , md5     = require('./md5.min')
  , readers = require('./readers')
  , supportsWorkers = supportsWebWorkers()
  , workerQueue     = []
  , md5Worker;

// Process the next MD5 task in the queue (if any)
var nextMd5Task = function() {
    if (workerQueue.length > 1) {
        // Worker should already be processing, next task
        // will be run once the current one is done
        return;
    } else if (workerQueue.length) {
        // Only one item in queue? Let the worker process it now
        md5Worker.postMessage(workerQueue[0].buffer);
    }
};

var addMd5Task = function(buffer, callback) {
    if (supportsWorkers) {
        // We have a worker queue, push an item into it and start processing
        workerQueue.push({ buffer: buffer, callback: callback });
        nextMd5Task();
    } else {
        // We don't have any Web Worker support,
        // queue an MD5 operation on the next tick
        process.nextTick(function() {
            callback(undefined, md5.ArrayBuffer.hash(buffer));
        });
    }
};

if (supportsWorkers) {
    // Set up the actual web worker
    md5Worker = new Worker('./md5-worker.js');
    md5Worker.addEventListener('message', function(e) {
        var item = workerQueue.shift();
        item.callback(undefined, e.data);

        nextMd5Task();
    }, false);
}

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
        process.nextTick(function() {
            addMd5Task(buffer, callback);
        });
    }
};