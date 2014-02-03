var extend = require('../../lib/utils/extend')
  , assert = require('assert');

describe('extend', function() {

    describe('#extend', function() {
        it('should extend an object', function() {
            var original = { 'foo': 'bar' };
            extend(original, { 'moo': 'tools' });

            assert.equal(Object.keys(original).length, 2);
            assert.equal(original.moo, 'tools');
        });

        it('should overwrite previously set values', function() {
            var original = { 'foo': 'bar' };
            extend(original, { 'foo': 'newvalue' });

            assert.equal(original.foo, 'newvalue');
        });
    });

});