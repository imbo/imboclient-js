'use strict';

function get404Handler(callback) {
    return function(err, res) {
        // If we encounter an error from the server, we might not have
        // statusCode available - in this case, fall back to undefined
        var statusCode = res && res.statusCode ? res.statusCode : null;

        // Request error?
        var reqErr = err && err.statusCode !== 404 ? err : null;

        // Requester returns error on 404, we expect this to happen
        callback(reqErr, statusCode === 200);
    };
}

module.exports = get404Handler;
