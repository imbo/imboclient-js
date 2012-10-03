var Imbo   = require('../lib/imbo')
  , assert = require('assert')
  , nock   = require('nock')
  , sys    = require('sys');

describe('ImboClient', function() {

    var client = new Imbo.Client('http://imbo', 'pub', 'priv');

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
        it('should return error on a non-200 response', function() {
            nock('http://imbo')
                .head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(404)
                .head('/users/pub/images/61ca9892205a0d5077a353eb3487e8c8')
                .reply(503);

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(404, err);
            });

            client.headImage('61ca9892205a0d5077a353eb3487e8c8', function(err, res) {
                assert.equal(503, err);
            });
        });
    });

});
