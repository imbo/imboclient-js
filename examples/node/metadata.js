/**
 * This example will do the following:
 *
 *  - Instantiates an instance of the Imbo client
 *  - Checks if the target image exists on the server
 *  - Adds some metadata to the image
 *  - Retrieves and displays the stored metadata
 *  - Deletes the metadata
 */
'use strict';

// Include the essentials (we only use fs for checking for a config-file)
var Imbo = require('../../'),
    fs   = require('fs'),
    md5  = '61da9892205a0d5077a353eb3487e8c8',
    config;

try {
    fs.statSync(__dirname + '/config.json');
    config = require('./config.json');
} catch (e) {
    return console.log('Could not load config file (config.json) - have you copied and customized config.json.dist?');
}

// Lets get going!

// Instantiating client
var client = new Imbo.Client(config.hosts, config.pubKey, config.privKey);

// Check if the image exists on the server
console.log('Checking if the image exists on server...');
client.imageIdentifierExists(md5, function(err, exists) {
    if (err) {
        return console.log('Oh ouch, something went wrong!', err);
    }

    if (!exists) {
        return console.log('Image does not exist on server. Run add-image.js first.');
    }

    meta.add();
});

var meta = {
    add: function() {
        console.log('Adding some metadata...');
        client.editMetadata(md5, {
            random: Math.random(),
            time: Date.now(),
            foo: 'bar'
        }, function(err) {
            if (err) {
                return console.log('Oh no! Something went horribly wrong!', err);
            }

            meta.get();
        });
    },

    get: function() {
        console.log('Fetching metadata...');
        client.getMetadata(md5, function(err, data) {
            if (err) {
                return console.log('Oh no! Something went horribly wrong!', err);
            }

            console.log('Here\'s the data we got for this image:');
            console.dir(data);

            meta.del();
        });
    },

    del: function() {
        console.log('Deleting metadata...');
        client.deleteMetadata(md5, function(err) {
            if (err) {
                return console.log('Could not delete metadata for image :(', err);
            }

            console.log('Metadata deleted.');
        });
    }
};
