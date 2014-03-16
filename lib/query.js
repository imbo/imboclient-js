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

/**
 * Constructs a new Imbo image query
 *
 */
var ImboQuery = function() {
    this.values = {};
    this.reset();
};

/**
 * Sort descending
 *
 * @type {String}
 */
ImboQuery.SORT_DESC = 'desc';

/**
 * Sort ascending
 *
 * @type {String}
 */
ImboQuery.SORT_ASC  = 'asc';

extend(ImboQuery.prototype, {

    /**
     * Appends a value to the given key
     *
     * @param  {String} key
     * @param  {*}      value
     * @return {Imbo.Query}
     */
    appendValue: function(key, value) {
        this.values[key] = this.values[key].concat(value);
        return this;
    },

    /**
     * Set the value for the given key. If no value is specified, the current value is returned.
     *
     * @param  {String}     key
     * @param  {*}          [value]
     * @return {Imbo.Query}
     */
    setOrGet: function(key, value) {
        if (value === undefined) {
            return this.values[key];
        }

        this.values[key] = [].concat(value);
        return this;
    },

    /**
     * Set the IDs to fetch. If no value is specified, the current value is returned.
     *
     * @param  {Array} [ids]
     * @return {Imbo.Query}
     */
    ids: function(ids) { return this.setOrGet('ids', ids); },

    /**
     * Add an ID to the list of IDs to fetch.
     *
     * @param  {String} id
     * @return {Imbo.Query}
     */
    addId: function(id) { return this.appendValue('ids', id); },

    /**
     * Adds one or more IDs to the list of existing values.
     *
     * @param  {String|Array} ids
     * @return {Imbo.Query}
     */
    addIds: function(ids) { return this.addId(ids); },

    /**
     * Set the checksums of the images you want returned. If no value is specified, the current value is returned.
     *
     * @param  {Array} [sums]
     * @return {Imbo.Query}
     */
    checksums: function(sums) { return this.setOrGet('checksums', sums); },

    /**
     * Adds a checksum to the list of existing values.
     *
     * @param  {String} sum
     * @return {Imbo.Query}
     */
    addChecksum: function(sum) { return this.appendValue('checksums', sum); },

    /**
     * Adds one or more checksums to the list of existing values.
     *
     * @param  {String|Array} sums
     * @return {Imbo.Query}
     */
    addChecksums: function(sums) { return this.addChecksum(sums); },

    /**
     * Set the original checksums of the images you want returned. If no value is specified, the current value is returned.
     *
     * @param  {Array} [sums]
     * @return {Imbo.Query}
     */
    originalChecksums: function(sums) { return this.setOrGet('originalChecksums', sums); },

    /**
     * Adds an original checksum to the list of existing values.
     *
     * @param  {String} sum
     * @return {Imbo.Query}
     */
    addOriginalChecksum: function(sum) { return this.appendValue('originalChecksums', sum); },

    /**
     * Adds one or more original checksums to the list of existing values.
     *
     * @param  {String|Array} sums
     * @return {Imbo.Query}
     */
    addOriginalChecksums: function(sums) { return this.addOriginalChecksum(sums); },

    /**
     * Set the fields to return from the images resource. If no value is specified, the current value is returned.
     *
     * @param  {Array} [fields]
     * @return {Imbo.Query}
     */
    fields: function(fields) { return this.setOrGet('fields', fields); },

    /**
     * Adds a field to the list of current fields to return.
     *
     * @param  {String} field
     * @return {Imbo.Query}
     */
    addField: function(field) { return this.appendValue('fields', field); },

    /**
     * Adds one or more fields to the list of current fields to return.
     *
     * @param  {String|Array} fields
     * @return {Imbo.Query}
     */
    addFields: function(fields) { return this.addField(fields); },

    /**
     * Sets the field and direction to sort. If not values are specified, the current value is returned.
     *
     * @param  {String|Array}     [field] - Field to sort on, or an array of sort value
     * @param  {String}           [direction] - Direction to sort ("asc" or "desc")
     * @param  {Boolean}          [append=false] - Whether to append the value or replace the current value
     * @return {Imbo.Query|Array}
     */
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

    /**
     * Adds a sort to the current list of sorts.
     *
     * @param  {String} field
     * @param  {String} [direction]
     * @return {Imbo.Query}
     */
    addSort: function(field, direction) {
        return this.sort(field, direction, true);
    },

    /**
     * Adds one or more sorts to the current list of sorts
     *
     * @param  {Array|String} sorts
     * @return {Imbo.Query}
     */
    addSorts: function(sorts) {
        return this.appendValue('sort', sorts);
    },

    /**
     * Sets the page number to fetch. If no value is specified, the current value is returned.
     *
     * @param  {Number} val
     * @return {Imbo.Query}
     */
    page: function(val) {
        if (!val) { return this.values.page; }
        this.values.page = parseInt(val, 10);
        return this;
    },

    /**
     * Sets the maximum number of items per page. If no value is specified, the current value is returned.
     *
     * @param  {Number} val
     * @return {Imbo.Query}
     */
    limit: function(val) {
        if (!val) { return this.values.limit; }
        this.values.limit = val;
        return this;
    },

    /**
     * Sets whether to return the metadata associated with the images or not. If no value is specified, the current value is returned.
     *
     * @param  {Boolean} val
     * @return {Imbo.Query}
     */
    metadata: function(val) {
        if (typeof val === 'undefined') { return this.values.metadata; }
        this.values.metadata = !!val;
        return this;
    },

    /**
     * Sets the earliest upload date of images to return. If no value is specified, the current value is returned.
     *
     * @param  {Date} val
     * @return {Imbo.Query}
     */
    from: function(val) {
        if (!val) { return this.values.from; }
        this.values.from = val instanceof Date ? val : this.values.from;
        return this;
    },

    /**
     * Sets the latest upload date of images to return. If no value is specified, the current value is returned.
     *
     * @param  {Number} val
     * @return {Imbo.Query}
     */
    to: function(val) {
        if (!val) { return this.values.to; }
        this.values.to = val instanceof Date ? val : this.values.to;
        return this;
    },

    /**
     * Reset the query to default values
     *
     * @return {Imbo.Query}
     */
    reset: function() {
        var vals = this.values;

        vals.page = 1;
        vals.limit = 20;
        vals.metadata = false;
        vals.from = null;
        vals.to = null;
        vals.ids = [];
        vals.checksums = [];
        vals.fields = [];
        vals.sort = [];
        vals.originalChecksums = [];

        return this;
    },

    /**
     * Generate a query string from the set parameters
     *
     * @return {String}
     */
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
            parts.push(key + '=' + params[key]);
        }

        // Get multi-value params
        ['ids', 'checksums', 'originalChecksums', 'fields', 'sort'].forEach(function(item) {
            this[item].forEach(function(value) {
                parts.push(item + '[]=' + value);
            });
        }.bind(this.values));

        return parts.join('&');
    },

    /**
     * Alias of getQueryString()
     *
     * @return {String}
     */
    toString: function() {
        return this.toQueryString();
    }
});

module.exports = ImboQuery;
