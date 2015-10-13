'use strict';

var parseUrls = require('../../lib/utils/parse-urls'),
    assert = require('assert');

describe('parseUrls', function() {
    it('should handle being passed a server-string', function() {
        var urls = parseUrls('http://imbo');
        assert.equal(1, urls.length);
        assert.equal('http://imbo', urls[0]);
    });

    it('should handle being passed an array', function() {
        var hosts = ['http://imbo01', 'http://imbo02', 'http://imbo03'];
        var urls = parseUrls(hosts), host = hosts.length;
        assert.equal(3, urls.length);

        while (host--) {
            assert.equal(hosts[host], urls[host]);
        }
    });

    it('should strip trailing slashes', function() {
        assert.equal('http://imbo', parseUrls('http://imbo/')[0]);
        assert.equal('http://imbo/some/path', parseUrls('http://imbo/some/path/')[0]);
    });

    it('should strip port 80', function() {
        assert.equal('http://imbo', parseUrls('http://imbo/:80')[0]);
        assert.equal('http://imbo/some/path', parseUrls('http://imbo:80/some/path/')[0]);
    });

    it('should throw error if not a string or array', function() {
        assert.throws(function() {
            parseUrls({});
        }, /options\.hosts.*?array/);
    });

    it('should throw error on empty array', function() {
        assert.throws(function() {
            parseUrls([]);
        }, /options\.hosts.*?array/);
    });
});
