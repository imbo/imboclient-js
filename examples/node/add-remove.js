/**
 * This very simple example does the following:
 *
 *  - Instantiates an instance of the Imbo client
 *  - Checks if the image already exists on the server
 *  - Deletes the image if it exist
 *  - Adds an image to the Imbo-server if it does not exist
 *  - Prints the URL for the added image
 *  - Applies some transformations to the image and prints the URL for that version
 */
'use strict';

// Include the essentials (we only use fs for checking for a config-file)
var Imbo = require('../../'),
    fs   = require('fs'),
    img  = __dirname + '/../../test/fixtures/cat.jpg',
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

// Check if the image exists on the server already
console.log('Checking if the image already exists on server...');
client.imageExists(img, function(err, exists, imageIdentifier) {
    if (err) {
        return console.log('Oh ouch, something went wrong!', err);
    }

    if (exists) {
        console.log('The image already exists on server. Deleting it.');

        client.deleteImage(imageIdentifier, function(err) {
            if (err) {
                return console.log('Could not delete image :(', err);
            }

            console.log('Image deleted! Run me again to re-add it.');
        });
    } else {

        // Lets add an image to the server
        console.log('Adding image to server...');
        client.addImage(img, function(err, imageIdentifier, response) {
            // Remember to check for any errors
            if (err) {
                return console.log('Oh no! Something went horribly wrong!', err, response);
            }

            console.log('Hooray! We added the image to the server!');

            // Lets get the URL for our image!
            var url = client.getImageUrl(imageIdentifier);
            console.log('URL: ' + url);

            // Bit more interesting, lets add some transformations:
            url.thumbnail(200, 200).border('000', 5, 5);
            console.log('Transformed URL: ' + url);

            // Maybe we just want to flip it, instead?
            url.reset().flipVertically();
            console.log('Vertically flipped: ' + url);

            // And we're done
            console.log('All done...');
        });

    }
});
