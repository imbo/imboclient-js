# Javascript client for imbo
A javascript (browser/[node.js](http://nodejs.org/)) client for [imbo](https://github.com/imbo/imbo).

## Basic usage (node.js)
```javascript
var Imbo = require('imbo-client');

var client = new Imbo.Client(['http://imbo.somehost.com'], 'publicKey', 'privateKey');

// Path to local image
var path = '/path/to/image.png';

client.addImage(path, function(err, imageIdentifier, data) {
    if (err) {
        console.log('Something went wrong!', err);
    } else {
        console.log('Image uploaded! Identifier: ' + imageIdentifier);
        console.log('Url: ' + client.getImageUrl(imageIdentifier).thumbnail(100, 100).jpg());
    }
});
```


## More?
More to come :-)
