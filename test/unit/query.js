var Imbo   = require('../../')
  , assert = require('assert')
  , util   = require('util')
  , catMd5 = '61da9892205a0d5077a353eb3487e8c8';

describe('Imbo.Query', function() {

    var query;
    beforeEach(function() {
        query = new Imbo.Query();
    });

    describe('#page', function() {
        it('should be able to set and get a value', function() {
            assert.equal(query.page(5), query, 'page(val) should return query instance');
            assert.equal(query.page(),  5,     'page() should return the set value');
        });
    });

    describe('#limit', function() {
        it('should be able to set and get a value', function() {
            assert.equal(query.limit(5), query, 'limit(val) should return query instance');
            assert.equal(query.limit(),  5,     'limit() should return the set value');
        });
    });

    describe('#metadata', function() {
        it('should be able to set and get a value', function() {
            assert.equal(query.metadata(true), query, 'metadata(val) should return query instance');
            assert.equal(query.metadata(),  true,     'metadata() should return the set value');
        });
    });

    describe('#query', function() {
        it('should be able to set and get a value', function() {
            assert.equal(query.query('elePHPant'), query, 'query(val) should return query instance');
            assert.equal(query.query(),   'elePHPant',    'query() should return the set value');
        });
    });

    describe('#from', function() {
        it('should be able to set and get a date', function() {
            var now = new Date();
            assert.equal(query.from(now), query, 'from(val) should return query instance');
            assert.equal(query.from(),    now,   'from() should return the set value');
        });
    });

    describe('#to', function() {
        it('should be able to set and get a date', function() {
            var to = new Date();
            assert.equal(query.to(to), query, 'to(val) should return query instance');
            assert.equal(query.to(),   to,    'to() should return the set value');
        });

        it('should not set a value if the value is not a date', function() {
            assert.equal(query.to(123), query, 'to(val) should return query instance');
            assert.notEqual(query.to(), 123);
        });
    });

    describe('#toQueryString', function() {
        it('should include the defaults for page and limit', function() {
            assert.equal(query.toString(), 'page=1&limit=20');
        });

        it('should JSON-encode and URL-encode queries properly', function() {
            query.query({ foo: 'bar', num: 15 });
            assert.equal(query.toString(), 'page=1&limit=20&query=%7B%22foo%22%3A%22bar%22%2C%22num%22%3A15%7D');
        });

        it('should provide timestamp for a set "from"-parameter', function() {
            query.from(new Date(1381272144291));
            assert.equal(query.toString(), 'page=1&limit=20&from=1381272144');
        });

        it('should provide timestamp for a set "to"-parameter', function() {
            query.to(new Date(1371272144291));
            assert.equal(query.toString(), 'page=1&limit=20&to=1371272144');
        });
    });

});