'use strict';

exports.getUnsupported = function() {
    var unsupported = [];
    if (!window.FileReader) {
        unsupported.push('FileReader');
    }

    if (!window.ArrayBuffer) {
        unsupported.push('ArrayBuffer');
    }

    if (!window.XMLHttpRequest) {
        unsupported.push('XMLHttpRequest');
    }

    if (!('upload' in new XMLHttpRequest())) {
        unsupported.push('XMLHttpRequest2');
    }

    return unsupported;
};