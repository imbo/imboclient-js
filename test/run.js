var Imbo   = require('../')
  , assert = require('assert')
  , nock   = require('nock')
  , util   = require('util')
  , undef;

var signatureCleaner = function(path) {
    return path.replace(/timestamp=[^&]*&?/, '')
               .replace(/signature=[^&]*&?/, '')
               .replace(/\?$/g, '');
};

describe('ImboClient', function() {

    var client = new Imbo.Client(['http://imbo', 'http://imbo1', 'http://imbo2'], 'pub', 'priv')
      , mock   = nock('http://imbo');

    describe('#getImageIdentifier', function() {
        it('should return an error if file does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.getImageIdentifier(filename, function(err, identifier) {
                assert.equal('File does not exist (' + filename + ')', err);
                done();
            });
        });

        it('should generate correct md5sum for a file that exists', function(done) {
            client.getImageIdentifier(__dirname + '/cat.jpg', function(err, identifier) {
                assert.equal('61da9892205a0d5077a353eb3487e8c8', identifier);
                assert.equal(undef, err);
                done();
            });
        });
    });

    describe('#generateSignature', function() {
        it('should generate a valid signature', function() {
            var sig;
            sig = client.generateSignature('GET', '/images', '2012-10-11T15:10:17Z');
            assert.equal(sig, 'fd16a910040350f12df83b2e077aa2afdcd0f4d262e69eb84d3ad3ee1e5a243c');

            sig = client.generateSignature('PUT', '/images/61ca9892205a0d5077a353eb3487e8c8', '2012-10-03T12:43:37Z');
            assert.equal(sig, 'be7180d7f04aa60bb19180d035c39e1b8cb4034f75b7dcf02bf9f214a53673bc');
        });
    });

    describe('#getSignedResourceUrl', function() {
        it('should generate a valid, signed resource url', function() {
            var url = client.getSignedResourceUrl('PUT', '/images/61ca9892205a0d5077a353eb3487e8c8', new Date(1349268217000));
            assert.equal(url, '/images/61ca9892205a0d5077a353eb3487e8c8?signature=be7180d7f04aa60bb19180d035c39e1b8cb4034f75b7dcf02bf9f214a53673bc&timestamp=2012-10-03T12%3A43%3A37Z');
        });
    });

    describe('#getHostForImageIdentifier', function() {
        it('should return the same host for the same image identifiers every time', function() {
            for (var i = 0; i < 10; i++) {
                assert.equal('http://imbo1', client.getHostForImageIdentifier('61ca9892205a0d5077a353eb3487e8c8'));
                assert.equal('http://imbo2', client.getHostForImageIdentifier('3b71c51547c3aa1ae81a5e9c57dfef67'));
                assert.equal('http://imbo',  client.getHostForImageIdentifier('3faab4bb128b56bd7d7e977164b3cc7f'));
                assert.equal('http://imbo1', client.getHostForImageIdentifier('61ca9892205a0d5077a353eb3487e8c8'));
            }
        });
    });

    describe('#parseUrls()', function() {
        it('should handle being passed a server-string', function() {
            var urls = client.parseUrls('http://imbo');
            assert.equal(1, urls.length);
            assert.equal('http://imbo', urls[0]);
        });

        it('should handle being passed an array', function() {
            var hosts = ['http://imbo01', 'http://imbo02', 'http://imbo03'];
            var urls = client.parseUrls(hosts), host = hosts.length;
            assert.equal(3, urls.length);

            while (host--) {
                assert.equal(hosts[host], urls[host]);
            }
        });

        it('should strip trailing slashes', function() {
            assert.equal('http://imbo', client.parseUrls('http://imbo/')[0]);
            assert.equal('http://imbo/some/path', client.parseUrls('http://imbo/some/path/')[0]);
        });

        it('should strip port 80', function() {
            assert.equal('http://imbo', client.parseUrls('http://imbo/:80')[0]);
            assert.equal('http://imbo/some/path', client.parseUrls('http://imbo:80/some/path/')[0]);
        });
    });

    describe('#headImage()', function() {
        it('should return error on a 404-response', function(done) {
            mock.head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(404);

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(404, err);
                done();
            });
        });

        it('should return error on a 503-response', function(done) {
            mock.head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(503);

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(503, err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            mock.head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(200);

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(undef, err);
                done();
            });
        });

        it('should return an http-response on success', function(done) {
            mock.head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(200, 'OK', { 'X-Imbo-Imageidentifier': '61ca9892205a0d5077a353eb3487e8c8' });

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], '61ca9892205a0d5077a353eb3487e8c8');
                done();
            });
        });
    });

    describe('#deleteImage()', function() {
        it('should return an http-response on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8', 'DELETE')
                .reply(200, 'OK', { 'X-Imbo-Imageidentifier': '61ca9892205a0d5077a353eb3487e8c8' });

            client.deleteImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], '61ca9892205a0d5077a353eb3487e8c8');
                done();
            });
        });
    });

    after(function() {
        mock.done();
    });

});
