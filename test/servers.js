'use strict';

var net  = require('net'),
    http = require('http'),
    fs   = require('fs');

exports.createResetServer = function(port) {
    var server = net.createServer(function(socket) {
        socket.on('error', function() {});
        socket.end();
    });

    server.on('error', function() {});
    server.listen(port || 6776, '127.0.0.1');

    return server;
};

exports.createStaticServer = function(port) {
    var server = http.createServer(function(req, res) {
        if (req.url === '/cat.jpg') {
            var file = __dirname + '/fixtures/cat.jpg',
                stat = fs.statSync(file);

            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': stat.size
            });

            fs.createReadStream(file).pipe(res);
        } else {
            var msg = 'File not found';
            res.writeHead(404, {
                'Content-Type': 'text/plain',
                'Content-Length': msg.length
            });
            res.end(msg, 'utf8');
        }
    });

    server.on('error', function() {});
    server.listen(port || 6775, '127.0.0.1');

    return server;
};
