/**
 * Yeah, these are not unit tests, they are a simple chain of methods
 * This will be changed in the future
 */

var Imbo   = require(__dirname + '/../lib/imbo')
  , config = require('./config')
  , imgId  = null;

var client = new Imbo.Client(config.imbo);

// Some simple image "tests"
var imageExists = function() {
    client.imageExists(config.imgPath, function(exists) {
        if (!exists) {
            console.log('Image does not exist, adding!');
            uploadImage();
        } else {
            console.log('Image exists, deleting!');
            deleteImage();
        }
    });
};

var uploadImage = function() {
    client.addImage(config.imgPath, function(err, res, data) {
        console.log('Added image, response: ', data);

        // Set imageidentifier so we can keep using it throughout our tests
        imgId = res.headers['x-imbo-imageidentifier'];

        headImage();
    });
};

var headImage = function() {
    client.headImage(imgId, function(err, res) {
        console.log('HEAD\'ed image, x-imbo-originalfilesize: ', res.headers['x-imbo-originalfilesize']);

        editMeta();
    });
};

var deleteImage = function() {
    client.deleteImage(imgId, function(err, res, data) {
        console.log('Deleted image, response: ', data);
    });
}

// Some simple metadata "tests"
var editMeta = function() {
    client.editMetadata(imgId, { foo: 'bar', edited: true }, function(err, res, data) {
        console.log('Edited metadata, response: ', data);

        getMeta();
    });
};

var getMeta = function() {
    client.getMetadata(imgId, function(err, res, data) {
        console.log('Retrieved metadata, response: ', data);

        deleteMeta();
    });
};

var deleteMeta = function() {
    client.deleteMetadata(imgId, function(err, res, data) {
        console.log('Deleted metadata, response: ', data);

        imageExists();
    });
};

// Get image identifier and start chain
imageExists();