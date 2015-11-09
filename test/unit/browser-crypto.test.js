'use strict';

var fs = require('fs'),
    path = require('path'),
    md5 = require('../../lib/browser/md5.min'),
    sha = require('../../lib/browser/crypto').sha256,
    crypto = require('crypto'),
    assert = require('assert');

describe('crypto (browser)', function() {
    it('should generate correct md5 hashes for binary data', function() {
        var content = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'cat.jpg'));

        assert.equal(
            md5.ArrayBuffer.hash(toArrayBuffer(content)),
            crypto.createHash('md5').update(content, 'binary').digest('hex'),
            'Binary content of file did not have correct hash'
        );
    });

    it('should generate correct sha256+hmac hashes for strings', function() {
        [
            'foo',
            'bar',
            'http://imbo/users/dev/images/646a697ca1c71228f77014f7c5ce6b14.jpg' +
            '?t[]=smartSize:height=400,width=400,poi=1240,522'
        ].forEach(function(str) {
            var key = 'key=' + Date.now();
            assert.equal(
                sha(key, str),
                crypto.createHmac('sha256', key).update(str, 'utf8').digest('hex'),
                'String did not have correct hash'
            );

            // Also test a long key (special case for this in the sha implementation)
            key += key + key + key + key + key + key;
            assert.equal(
                sha(key, str),
                crypto.createHmac('sha256', key).update(str, 'utf8').digest('hex'),
                'String did not have correct hash'
            );
        });
    });

    it('should generate correct sha256+hmac hashes for strings with special chars', function() {
        var key = 'key=' + Date.now();
        var str = 'https://imbo/users/dev/images.json';
        str += '?t[]=foo&name=båt.jpg&t[]=maxSize:width=320,height=240';

        assert.equal(
            sha(key, str),
            crypto.createHmac('sha256', key).update(str, 'utf8').digest('hex'),
            'String did not have correct hash'
        );
    });
});

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}
