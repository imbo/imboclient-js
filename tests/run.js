/**
 * Yeah, these are not unit tests, they are a simple chain of methods
 * This will be changed in the future
 */

var Imbo   = require(__dirname + '/../lib/imbo')
  , config = require('./config')
  , imgId  = null;

var client = new Imbo.Client(config.imbo.hosts, config.imbo.publicKey, config.imbo.privateKey);

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

        headImage();
    });
};

var headImage = function() {
    client.headImage(imgId, function(err, res) {
        console.log('HEAD\'ed image, x-imbo-originalfilesize: ', res.headers['x-imbo-originalfilesize']);

        getImageUrl();
    });
};

var getImageUrl = function() {
    var url = client.getImageUrl(imgId);

    console.log('Url, thumbnailed: ' + url.thumbnail(100, 100));
    url.reset();
    console.log('Url, filtered: ' + url.border('bf1942', 2, 2).compress(70).jpg().crop(100, 0, 220, 320).flipHorizontally().flipVertically().resize(200, 200).rotate(45, 'c0c0c0').getUrl());

    editMeta();
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
imgId = client.getImageIdentifier(config.imgPath);
imageExists();