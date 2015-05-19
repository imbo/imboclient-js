'use strict';

var Imbo = require('../../'),
    assert = require('assert');

var signatureCleaner = function(path) {
    return (path
        .replace(/timestamp=[^&]*&?/, '')
        .replace(/signature=[^&]*&?/, '')
        .replace(/accessToken=[^&]*&?/, '')
        .replace(/[?&]$/g, '')
    );
};

describe('Imbo.Url', function() {
    var baseUrl = 'http://imbo',
        pub = 'pub',
        priv = 'priv',
        url;

    beforeEach(function() {
        url = new Imbo.Url({
            baseUrl: baseUrl,
            publicKey: pub,
            privateKey: priv
        });
    });

    describe('#getPublicKey', function() {
        it('should return the set publicKey', function() {
            assert.equal(url.getPublicKey(), pub);
        });
    });

    describe('#getPath', function() {
        it('should return the set path', function() {
            assert.equal(url.getPath(), '');
        });
    });

    describe('#setPath', function() {
        it('should return the url instance', function() {
            assert.equal(url.setPath('/moo'), url);
        });

        it('should set the passed path', function() {
            assert.equal(url.setPath('/moo').getPath(), '/moo');
        });
    });

    describe('#setPrivateKey', function() {
        it('should return the url instance', function() {
            assert.equal(url.setPrivateKey('rosebud'), url);
        });

        it('should set the passed private key', function() {
            var before = url.getAccessToken('/path');
            url.setPrivateKey('rosebud');
            assert.notEqual(url.getAccessToken('/path'), before);
        });
    });

    describe('#getQueryString', function() {
        it('should be empty string by default', function() {
            assert.equal(url.getQueryString(), '');
        });

        it('should be able to construct query with existing params', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                queryString: 'foo=bar&moo=tools'
            });

            assert.equal(u.getQueryString(), 'foo=bar&moo=tools');
        });
    });

    describe('#getUrl', function() {
        it('should contain the base URL', function() {
            assert.equal(signatureCleaner(url.getUrl()), baseUrl);
        });

        it('should generate the correct URL with no path specified', function() {
            assert.equal(signatureCleaner(url.getUrl()), 'http://imbo');
        });

        it('should generate the correct URL with a path specified', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                path: '/some/path'
            });

            assert.ok(u.getUrl().indexOf('http://imbo/some/path') > -1);
        });

        it('should generate correct access tokens for various urls', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                queryString: 'foo=bar&moo=tools'
            });

            assert.ok(u.getUrl().indexOf('accessToken=134f5c9cefdeded13111beaa99847b85b524e45deccf926be9416c1e6e2c4b12') > -1);
            assert.ok(url.getUrl().indexOf('accessToken=46e8cdac45370e35663ebccad21aa0190d0fb08643cf925f56f1e14ec9f29ca8') > -1);
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

            assert.equal(u.toString(), u.getUrl());
        });
    });
});
