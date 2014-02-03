/**
 * This file is part of the imboclient-js package
 *
 * (c) Espen Hovlandsdal <espen@hovlandsdal.com>
 *
 * For the full copyright and license information, please view the LICENSE file that was
 * distributed with this source code.
 */
'use strict';

// Shallow object extend
module.exports = function(target, extension) {
    for (var key in extension) {
        target[key] = extension[key];
    }
};
