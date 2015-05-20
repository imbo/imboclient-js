/* eslint no-console: 0 */

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
    path = require('path'),
    fs = require('fs');

var img = path.join(__dirname, '..', '..', 'test', 'fixtures', 'cat.jpg'),
    config;

try {
    fs.statSync(path.join(__dirname, '/config.json'));
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

        client.deleteImage(imageIdentifier, function(deleteErr) {
            if (deleteErr) {
                return console.log('Could not delete image :(', deleteErr);
            }

            console.log('Image deleted! Run me again to re-add it.');
        });
    } else {
        // Lets add an image to the server
        console.log('Adding image to server...');
        client.addImage(img, function(addImgErr, imgId, response) {
            // Remember to check for any errors
            if (addImgErr) {
                return console.log('Oh no! Something went horribly wrong!', addImgErr, response);
            }

            console.log('Hooray! We added the image to the server!');

            // Lets get the URL for our image!
            var url = client.getImageUrl(imgId);
            console.log('URL: ' + url);

            // Bit more interesting, lets add some transformations:
            url.thumbnail({ width: 200, height: 200 }).border({ color: '000', width: 5, height: 5 });
            console.log('Transformed URL: ' + url);

            // Maybe we just want to flip it, instead?
            url.reset().flipVertically();
            console.log('Vertically flipped: ' + url);

            // Or maybe we want a short URL to the image, with some transformations?
            url.reset().maxSize({ width: 640 }).sepia().png();
            client.getShortUrl(url, function(shortUrlErr, shortUrl) {
                if (shortUrlErr) {
                    console.error('An error occured: ', shortUrlErr);
                    return;
                }

                console.log('ShortURL: ' + shortUrl.toString());

                // And we're done
                console.log('All done...');
            });
        });
    }
});
