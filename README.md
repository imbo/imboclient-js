# Node.js client for imbo
A [node.js](http://nodejs.org/) client for [imbo](https://github.com/christeredvartsen/imbo).

## Basic usage

    var Imbo = require('imbo')
      , config = {
        'host': 'http://imbo.somehost.com',
        'privateKey': 'abcdefghijklmnopqrstuvwxyz123456',
        'publicKey' : '654321abcdefghijklmnopqrstuvwxyz'
      };

    var client = new Imbo.Client(config);

    // Path to local image
    var path = '/path/to/image.png';

    client.addImage(path, function(err, req, data) {

        if (err) {
            console.log('Something went wrong!', err);
        } else {
            console.log('Image uploaded! Identifier: ' + data.imageIdentifier);
            console.log('Url: ' + client.getImageUrl(data.imageIdentifier).thumbnail(100, 100));
        }

    });

## More?
More to come :-)