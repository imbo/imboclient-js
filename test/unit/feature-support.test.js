'use strict';

var features = require('../../lib/browser/feature-support'),
    assert = require('assert');

describe('feature-support', function() {
    var unsupported;

    describe('#getUnsupported', function() {
        it('should check for FileReader', function() {
            unsupported = features.getUnsupported({});
            assert.notEqual(-1, unsupported.indexOf('FileReader'));

            unsupported = features.getUnsupported({ FileReader: true });
            assert.equal(-1, unsupported.indexOf('FileReader'));
        });

        it('should check for ArrayBuffer', function() {
            unsupported = features.getUnsupported({});
            assert.notEqual(-1, unsupported.indexOf('ArrayBuffer'));

            unsupported = features.getUnsupported({ ArrayBuffer: true });
            assert.equal(-1, unsupported.indexOf('ArrayBuffer'));
        });

        it('should check for XMLHttpRequest', function() {
            unsupported = features.getUnsupported({});
            assert.notEqual(-1, unsupported.indexOf('XMLHttpRequest'));
        });

        it('should check for XMLHttpRequest2', function() {
            unsupported = features.getUnsupported({ 'XMLHttpRequest': function() {} });
            assert.notEqual(-1, unsupported.indexOf('XMLHttpRequest2'));

            var XMLHttpRequest = function() {};
            XMLHttpRequest.prototype.upload = {};

            unsupported = features.getUnsupported({ 'XMLHttpRequest': XMLHttpRequest });
            assert.equal(-1, unsupported.indexOf('XMLHttpRequest2'));
        });
    });

    describe('#checkFeatures', function() {
        it('should throw Error on unsupported features', function() {
            var shouldThrow = function() {
                features.checkFeatures({
                    FileReader: true,
                    ArrayBuffer: true
                });
            };

            assert.throws(shouldThrow, Error, 'Error thrown');
        });
    });
});
