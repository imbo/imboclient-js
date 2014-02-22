/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

var extend = require('./utils/extend');

var ImboQuery = function() {
    this.values = {
        page     : 1,
        limit    : 20,
        metadata : false,
        from     : null,
        to       : null,

        ids      : [],
        checksums: [],
        fields   : [],
        sort     : [],
        originalChecksums: []
    };
};

ImboQuery.SORT_DESC = 'desc';
ImboQuery.SORT_ASC  = 'asc';

extend(ImboQuery.prototype, {
    appendValue: function(key, value) {
        this.values[key] = this.values[key].concat(value);
        return this;
    },

    setOrGet: function(key, value) {
        if (value === undefined) {
            return this.values[key];
        }

        this.values[key] = [].concat(value);
        return this;
    },

    ids: function(ids) { return this.setOrGet('ids', ids); },
    addId: function(id) { return this.appendValue('ids', id); },
    addIds: function(id) { return this.addId(id); },

    checksums: function(sums) { return this.setOrGet('checksums', sums); },
    addChecksum: function(sum) { return this.appendValue('checksums', sum); },
    addChecksums: function(sums) { return this.addChecksum(sums); },

    originalChecksums: function(sums) { return this.setOrGet('originalChecksums', sums); },
    addOriginalChecksum: function(sum) { return this.appendValue('originalChecksums', sum); },
    addOriginalChecksums: function(sums) { return this.addOriginalChecksum(sums); },

    fields: function(sums) { return this.setOrGet('fields', sums); },
    addField: function(sum) { return this.appendValue('fields', sum); },
    addFields: function(sums) { return this.addField(sums); },

    sort: function(field, direction, append) {
        if (Array.isArray(field) || field === undefined) {
            return this.setOrGet('sort', field);
        }

        var sort = (direction ? [field, direction] : [field]).join(':');

        if (append) {
            this.values.sort.push(sort);
        } else {
            this.values.sort = [sort];
        }

        return this;
    },

    addSort: function(field, direction) {
        return this.sort(field, direction, true);
    },

    addSorts: function(sorts) {
        return this.appendValue('sort', sorts);
    },

    page: function(val) {
        if (!val) { return this.values.page; }
        this.values.page = parseInt(val, 10);
        return this;
    },

    limit: function(val) {
        if (!val) { return this.values.limit; }
        this.values.limit = val;
        return this;
    },

    metadata: function(val) {
        if (typeof val === 'undefined') { return this.values.metadata; }
        this.values.metadata = !!val;
        return this;
    },

    from: function(val) {
        if (!val) { return this.values.from; }
        this.values.from = val instanceof Date ? val : this.values.from;
        return this;
    },

    to: function(val) {
        if (!val) { return this.values.to; }
        this.values.to = val instanceof Date ? val : this.values.to;
        return this;
    },

    toQueryString: function() {
        // Retrieve query parameters, reduce params down to non-empty values
        var params = {}, key;
        for (key in this.values) {
            if (!Array.isArray(this.values[key]) && this.values[key]) {
                params[key] = this.values[key];
            }
        }

        // Get timestamps from dates
        if (params.from) {
            params.from = Math.floor(params.from.getTime() / 1000);
        }
        if (params.to) {
            params.to = Math.floor(params.to.getTime() / 1000);
        }

        // Build query string
        var parts = [];
        for (key in params) {
            parts.push(key + '=' + encodeURIComponent(params[key]));
        }

        // Get multi-value params
        ['ids', 'checksums', 'originalChecksums', 'fields', 'sort'].forEach(function(item) {
            this[item].forEach(function(value) {
                parts.push(item + '[]=' + encodeURIComponent(value));
            });
        }.bind(this.values));

        return parts.join('&');
    },

    toString: function() {
        return this.toQueryString();
    }
});

module.exports = ImboQuery;
