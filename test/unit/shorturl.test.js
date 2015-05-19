'use strict';

var Imbo = require('../../'),
    assert = require('assert');

var shortId = 'imboF00';

describe('Imbo.ShortUrl', function() {
    var baseUrl = 'http://imbo',
        url = new Imbo.ShortUrl({
            baseUrl: baseUrl,
            id: shortId
        });

    describe('#getId', function() {
        it('should return the set ShortUrl ID', function() {
            assert.equal(url.getId(), shortId);
        });
    });

    describe('#getUrl', function() {
        it('should return the correct URL', function() {
            assert.equal(url.getUrl(), baseUrl + '/s/' + shortId);
        });
    });

    describe('#toString', function() {
        it('should alias getUrl()', function() {
            assert.equal(url.toString(), url.getUrl());
        });
    });
});
