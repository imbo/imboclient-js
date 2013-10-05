'use strict';

var net = require('net');

exports.createServer = function(port) {
    var server = net.createServer(function(socket) {
        socket.on('error', function() {});
        socket.end();
    });

    server.on('error', function() {});
    server.listen(port || 6776, '127.0.0.1');

    return server;
};
