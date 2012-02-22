# Node.js client for imbo
A [node.js](http://nodejs.org/) client for [imbo](https://github.com/christeredvartsen/imbo).

## Basic usage
```javascript
var Imbo = require('imbo');

var client = new Imbo.Client(['http://imbo.somehost.com'], 'privateKey', 'publicKey');

// Path to local image
var path = '/path/to/image.png';

client.addImage(path, function(err, req, data) {
    if (err) {
        console.log('Something went wrong!', err);
    } else {
        console.log('Image uploaded! Identifier: ' + data.imageIdentifier);
        console.log('Url: ' + client.getImageUrl(data.imageIdentifier).thumbnail(100, 100).jpg());
    }
});
```


## More?
More to come :-)