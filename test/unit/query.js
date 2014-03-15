var Imbo   = require('../../')
  , assert = require('assert');

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

    describe('#ids', function() {
        it('should be able to set and get an array of ids', function() {
            var values = ['some', 'values', 'to', 'return'];
            assert.equal(query.ids(values), query, 'ids(val) should return query instance');
            assert.equal(
                query.ids().length,
                values.length,
                'ids() should contain the same number of values as the set value'
            );

            for (var i = 0; i < values.length; i++) {
                assert.equal(
                    query.ids().indexOf(values[i]),
                    i,
                    'ids() should contain the same values as the set value'
                );
            }
        });

        it('should create a copy of the array instead of referencing it', function() {
            var values = ['foo', 'bar'];
            assert.equal(query.ids(values), query, 'ids(val) should return query instance');
            assert.notEqual(query.ids(), values);
        });
    });

    describe('#addId', function() {
        it('should be able to append an id', function() {
            var values = ['some', 'values', 'to', 'return']
              , added  = 'moo';

            query.ids(values);

            assert.equal(query.addId(added), query, 'addId(val) should return query instance');
            assert.equal(
                query.ids().indexOf(added),
                values.length,
                'addId(id) should add the passed value to the end of the existing values'
            );
        });
    });

    describe('#addIds', function() {
        it('should be able to append multiple ids', function() {
            var values = ['some', 'values', 'to', 'return']
              , added  = ['moo', 'tools'];

            query.ids(values);

            assert.equal(query.addIds(added), query, 'addIds(val) should return query instance');

            var expected = values.concat(added);
            for (var i = 0; i < expected.length; i++) {
                assert.equal(
                    query.ids().indexOf(expected[i]),
                    i,
                    'addIds() should add the passed values to the end of the existing values'
                );
            }
        });
    });

    describe('#checksums', function() {
        it('should be able to set and get an array of checksums', function() {
            var values = ['some', 'values', 'to', 'return'];
            assert.equal(query.checksums(values), query, 'checksums(val) should return query instance');
            assert.equal(
                query.checksums().length,
                values.length,
                'checksums() should contain the same number of values as the set value'
            );

            for (var i = 0; i < values.length; i++) {
                assert.equal(
                    query.checksums().indexOf(values[i]),
                    i,
                    'checksums() should contain the same values as the set value'
                );
            }
        });

        it('should create a copy of the array instead of referencing it', function() {
            var values = ['foo', 'bar'];
            assert.equal(query.checksums(values), query, 'checksums(val) should return query instance');
            assert.notEqual(query.checksums(), values);
        });
    });

    describe('#addChecksum', function() {
        it('should be able to append a checksum', function() {
            var values = ['some', 'values', 'to', 'return']
              , added  = 'moo';

            query.checksums(values);

            assert.equal(query.addChecksum(added), query, 'addChecksum(val) should return query instance');
            assert.equal(
                query.checksums().indexOf(added),
                values.length,
                'addChecksums(id) should add the passed value to the end of the existing values'
            );
        });
    });

    describe('#addChecksums', function() {
        it('should be able to append multiple checksums', function() {
            var values = ['some', 'values', 'to', 'return']
              , added  = ['moo', 'tools'];

            query.checksums(values);

            assert.equal(query.addChecksums(added), query, 'addChecksums(val) should return query instance');

            var expected = values.concat(added);
            for (var i = 0; i < expected.length; i++) {
                assert.equal(
                    query.checksums().indexOf(expected[i]),
                    i,
                    'addChecksums() should add the passed values to the end of the existing values'
                );
            }
        });
    });

    describe('#originalChecksums', function() {
        it('should be able to set and get an array of originalChecksums', function() {
            var values = ['some', 'values', 'to', 'return'];
            assert.equal(query.originalChecksums(values), query, 'originalChecksums(val) should return query instance');
            assert.equal(
                query.originalChecksums().length,
                values.length,
                'originalChecksums() should contain the same number of values as the set value'
            );

            for (var i = 0; i < values.length; i++) {
                assert.equal(
                    query.originalChecksums().indexOf(values[i]),
                    i,
                    'originalChecksums() should contain the same values as the set value'
                );
            }
        });

        it('should create a copy of the array instead of referencing it', function() {
            var values = ['foo', 'bar'];
            assert.equal(query.originalChecksums(values), query, 'originalChecksums(val) should return query instance');
            assert.notEqual(query.originalChecksums(), values);
        });
    });

    describe('#addOriginalChecksum', function() {
        it('should be able to append an original checksum', function() {
            var values = ['some', 'values', 'to', 'return']
              , added  = 'moo';

            query.originalChecksums(values);

            assert.equal(query.addOriginalChecksum(added), query, 'addOriginalChecksum(val) should return query instance');
            assert.equal(
                query.originalChecksums().indexOf(added),
                values.length,
                'addOriginalChecksums(id) should add the passed value to the end of the existing values'
            );
        });
    });

    describe('#addOriginalChecksums', function() {
        it('should be able to append multiple originalChecksums', function() {
            var values = ['some', 'values', 'to', 'return']
              , added  = ['moo', 'tools'];

            query.originalChecksums(values);

            assert.equal(query.addOriginalChecksums(added), query, 'addOriginalChecksums(val) should return query instance');

            var expected = values.concat(added);
            for (var i = 0; i < expected.length; i++) {
                assert.equal(
                    query.originalChecksums().indexOf(expected[i]),
                    i,
                    'addOriginalChecksums() should add the passed values to the end of the existing values'
                );
            }
        });
    });

    describe('#fields', function() {
        it('should be able to set and get an array of fields', function() {
            var values = ['some', 'fields', 'to', 'return'];
            assert.equal(query.fields(values), query, 'fields(val) should return query instance');
            assert.equal(
                query.fields().length,
                values.length,
                'fields() should contain the same number of values as the set value'
            );

            for (var i = 0; i < values.length; i++) {
                assert.equal(
                    query.fields().indexOf(values[i]),
                    i,
                    'fields() should contain the same values as the set value'
                );
            }
        });

        it('should create a copy of the array instead of referencing it', function() {
            var values = ['foo', 'bar'];
            assert.equal(query.fields(values), query, 'fields(val) should return query instance');
            assert.notEqual(query.fields(), values);
        });
    });

    describe('#addField', function() {
        it('should be able to append a field', function() {
            var values = ['some', 'fields', 'to', 'return']
              , added  = 'moo';

            query.fields(values);

            assert.equal(query.addField(added), query, 'addField(val) should return query instance');
            assert.equal(
                query.fields().indexOf(added),
                values.length,
                'addField(id) should add the passed value to the end of the existing values'
            );
        });
    });

    describe('#addFields', function() {
        it('should be able to append multiple fields', function() {
            var values = ['some', 'fields', 'to', 'return']
              , added  = ['moo', 'tools'];

            query.fields(values);

            assert.equal(query.addFields(added), query, 'addFields(val) should return query instance');

            var expected = values.concat(added);
            for (var i = 0; i < expected.length; i++) {
                assert.equal(
                    query.fields().indexOf(expected[i]),
                    i,
                    'addFields() should add the passed values to the end of the existing values'
                );
            }
        });
    });

    describe('#sort', function() {
        it('should be able to set and get an array of sorts', function() {
            var values = ['created:desc', 'size:asc'];

            assert.equal(query.sort(values), query, 'sort(val) should return query instance');

            assert.equal(
                query.sort().length,
                values.length,
                'sort() should contain the same number of values as the set value'
            );

            for (var i = 0; i < values.length; i++) {
                assert.equal(
                    query.sort().indexOf(values[i]),
                    i,
                    'sort() should contain the same values as the set value'
                );
            }
        });

        it('should be able to set sort based on field and order arguments', function() {
            assert.equal(query.sort('created', 'desc'), query, 'sort(field, order) should return query instance');
            assert.equal(query.sort().length, 1, 'sort(field, order) should have added one element to sorts');
            assert.equal(query.sort()[0], 'created:desc', 'sort(field, order) should create correct entry');

            query.sort('size', 'asc');
            assert.equal(query.sort().length, 1, 'sort(field, order) should overwrite previous value');
            assert.equal(query.sort()[0], 'size:asc');
        });

        it('should be able to append a sort based on field and order arguments', function() {
            assert.equal(query.sort('created', 'desc', true), query, 'sort(field, order, true) should return query instance');
            assert.equal(query.sort().length, 1, 'sort(field, order, true) should have added one element to sorts');
            assert.equal(query.sort()[0], 'created:desc', 'sort(field, order, true) should create correct entry');

            query.sort('size', 'asc', true);
            assert.equal(query.sort().length, 2, 'sort(field, order, true) should append to previous value');
            assert.equal(query.sort()[0], 'created:desc');
            assert.equal(query.sort()[1], 'size:asc');
        });
    });

    describe('#addSort', function() {
        it('should be able to append a sort', function() {
            var values = ['created:desc', 'size:asc'];
            query.sort(values);

            assert.equal(query.addSort('awesomeness', 'desc'), query, 'addSort(field, order) should return query instance');
            assert.equal(
                query.sort().indexOf('awesomeness:desc'),
                values.length,
                'addSort(field, order) should add the passed value to the end of the existing values'
            );
        });
    });

    describe('#addSorts', function() {
        it('should be able to append multiple sorts', function() {
            var values = ['created:desc', 'size:asc']
              , added  = ['awesomess:desc', 'epicness:asc'];

            query.sort(values);

            assert.equal(query.addSorts(added), query, 'addSorts(val) should return query instance');

            var expected = values.concat(added);
            for (var i = 0; i < expected.length; i++) {
                assert.equal(
                    query.sort().indexOf(expected[i]),
                    i,
                    'addSorts() should add the passed values to the end of the existing values'
                );
            }
        });
    });

    describe('#reset', function() {
        it('should reset all fields', function() {
            query.page(5)
                 .limit(10)
                 .metadata(true)
                 .from(new Date())
                 .to(new Date())
                 .ids(['such ids'])
                 .checksums(['amaze'])
                 .fields(['much fields'])
                 .sort('wow', 'desc')
                 .originalChecksums(['many check']);

            // Sanity check
            assert.equal(10, query.limit());

            // Reset checks
            query.reset();
            assert.equal(1, query.page());
            assert.equal(20, query.limit());
            assert.equal(false, query.metadata());
            assert.equal(null, query.from());
            assert.equal(null, query.to());
            assert.equal(0, query.ids().length);
            assert.equal(0, query.checksums().length);
            assert.equal(0, query.fields().length);
            assert.equal(0, query.sort().length);
            assert.equal(0, query.originalChecksums().length);
        });
    });

    describe('#toQueryString', function() {
        it('should include the defaults for page and limit', function() {
            assert.equal(query.toQueryString(), 'page=1&limit=20');
        });

        it('should provide timestamp for a set "from"-parameter', function() {
            query.from(new Date(1381272144291));
            assert.equal(query.toQueryString(), 'page=1&limit=20&from=1381272144');
        });

        it('should provide timestamp for a set "to"-parameter', function() {
            query.to(new Date(1371272144291));
            assert.equal(query.toQueryString(), 'page=1&limit=20&to=1371272144');
        });

        it('should handle multiple ids correctly', function() {
            query.ids([123, 456]);
            assert.equal(query.toQueryString(), 'page=1&limit=20&ids[]=123&ids[]=456');
        });

        it('should handle multiple checksums correctly', function() {
            query.checksums([123, 456]);
            assert.equal(query.toQueryString(), 'page=1&limit=20&checksums[]=123&checksums[]=456');
        });

        it('should handle multiple originalChecksums correctly', function() {
            query.originalChecksums([123, 456]);
            assert.equal(query.toQueryString(), 'page=1&limit=20&originalChecksums[]=123&originalChecksums[]=456');
        });

        it('should handle multiple sorts correctly', function() {
            query.sort(['created:desc', 'awesomeness:asc']);
            assert.equal(query.toQueryString(), 'page=1&limit=20&sort[]=created:desc&sort[]=awesomeness:asc');
        });
    });

    describe('#toString', function() {
        it('should proxy to toQueryString()', function() {
            query.limit(1337).page(3).metadata(true);
            assert.equal(
                query.toString(),
                query.toQueryString()
            );
        });
    });

});
