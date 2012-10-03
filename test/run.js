var Imbo   = require('../lib/imbo')
  , assert = require('assert')
  , nock   = require('nock')
  , util    = require('util');

describe('ImboClient', function() {

    var client = new Imbo.Client('http://imbo', 'pub', 'priv')
      , mock   = nock('http://imbo').log(util.puts);

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
                var undef;
                assert.equal(undef, err);
                done();
            });
        });

        it('should return an http-response', function(done) {
            mock.head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(200, '', { 'X-Imbo-Imageidentifier': '73c6643f30979b67a546d4629d19f2a3' });

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], '73c6643f30979b67a546d4629d19f2a3');
                done();
            });
        });
    });

    describe('#deleteImage()', function() {
        it('should blah', function(done) {
            mock.intercept('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8', 'DELETE')
                .reply(200);

            client.deleteImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equals(res, 'moo');
            });

            done();
        });
    });

    after(function() {
        mock.done();
    });

});
