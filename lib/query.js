'use strict';

var ImboQuery = function() {
    this.values = {
        page    : 1,
        limit   : 20,
        metadata: false,
        query   : null,
        from    : null,
        to      : null
    };
};

ImboQuery.prototype.page = function(val) {
    if (!val) { return this.values.page; }
    this.values.page = parseInt(val, 10);
    return this;
};

ImboQuery.prototype.limit = function(val) {
    if (!val) { return this.values.limit; }
    this.values.limit = val;
    return this;
};

ImboQuery.prototype.metadata = function(val) {
    if (typeof val === 'undefined') { return this.values.metadata; }
    this.values.metadata = !!val;
    return this;
};

ImboQuery.prototype.query = function(val) {
    if (!val) { return this.values.query; }
    this.values.query = val;
    return this;
};

ImboQuery.prototype.from = function(val) {
    if (!val) { return this.values.from; }
    this.values.from = val instanceof Date ? val : this.values.from;
    return this;
};

ImboQuery.prototype.to = function(val) {
    if (!val) { return this.values.to; }
    this.values.to = val instanceof Date ? val : this.values.to;
    return this;
};

ImboQuery.prototype.toQueryString = function() {
    // Retrieve query parameters, reduce params down to non-empty values
    var params = {}, keys = ['page', 'limit', 'metadata', 'query', 'from', 'to'];
    for (var i = 0; i < keys.length; i++) {
        if (!!this.values[keys[i]]) {
            params[keys[i]] = this.values[keys[i]];
        }
    }

    // JSON-encode metadata query, if present
    if (params.query) {
        params.query = JSON.stringify(params.query);
    }

    // Get timestamps from dates
    if (params.from) {
        params.from = Math.floor(params.from.getTime() / 1000);
    }
    if (params.to) {
        params.to = Math.floor(params.to.getTime() / 1000);
    }

    // Build query string
    var parts = [], key;
    for (key in params) {
        parts.push(key + '=' + encodeURIComponent(params[key]));
    }
    return parts.join('&');
};

ImboQuery.prototype.toString = ImboQuery.prototype.toQueryString;

module.exports = ImboQuery;
