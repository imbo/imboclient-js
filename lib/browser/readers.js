(function(undefined) {
    'use strict';

    module.exports = {
        getContentsFromFile: function(file, callback) {
            var reader = new FileReader();
            reader.onload = function(e) {
                return callback(undefined, e.target.result);
            };
            reader.readAsBinaryString(file);
        },

        getContentsFromUrl: function(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    callback(undefined, xhr.responseText);
                }
            };
            xhr.send(null);
        }
    };

})();
