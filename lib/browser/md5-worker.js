/* global self */
'use strict';
var md5 = require('./md5.min');
self.onmessage = function(e) {
    self.postMessage(md5.ArrayBuffer.hash(e.data));
};
