var Imbo   = require('../../'),
    assert = require('assert'),
    catMd5 = '61da9892205a0d5077a353eb3487e8c8';

var signatureCleaner = function(path) {
    return path.replace(/timestamp=[^&]*&?/, '')
               .replace(/signature=[^&]*&?/, '')
               .replace(/accessToken=[^&]*&?/, '')
               .replace(/[?&]$/g, '');
};

require('should');

describe('Imbo.Url', function() {

    var baseUrl = 'http://imbo',
        pub = 'pub',
        priv = 'priv',
        url = new Imbo.Url({
            baseUrl: baseUrl,
            publicKey: pub,
            privateKey: priv
        });

    describe('#getQueryString', function() {
        it('should be empty string by default', function() {
            url.getQueryString().should.equal('');
        });

        it('should be able to construct query with existing params', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                queryString: 'foo=bar&moo=tools'
            });

            u.getQueryString().should.equal('foo=bar&moo=tools');
        });
    });

    describe('#getUrl', function() {
        it('should contain the base URL', function() {
            signatureCleaner(url.getUrl()).should.equal(baseUrl);
        });

        it('should generate the correct URL with no path specified', function() {
            signatureCleaner(url.getUrl()).should.equal('http://imbo');
        });

        it('should generate the correct URL with a path specified', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                path: '/some/path'
            });

            u.getUrl().should.include('http://imbo/some/path');
        });

        it('should generate correct access tokens for various urls', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                queryString: 'foo=bar&moo=tools'
            });

            u.getUrl().should.include('accessToken=134f5c9cefdeded13111beaa99847b85b524e45deccf926be9416c1e6e2c4b12');
            url.getUrl().should.include('accessToken=46e8cdac45370e35663ebccad21aa0190d0fb08643cf925f56f1e14ec9f29ca8');
        });
    });

    describe('#toString', function() {
        it('should alias getUrl()', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                queryString: 'foo=bar&moo=tools'
            });

            u.toString().should.equal(u.getUrl());
        });
    });

});
