[![npm version][1]][2] [![Build Status][2]][3] [![dependency status][4]][5]

# Javascript client for Imbo
A Javascript (node/browser) client for [Imbo](https://github.com/imbo/imbo).

## Installation
imboclient-js can be installed using [npm](https://npmjs.org/) or [bower](http://bower.io/):

```
# NPM:
npm install imboclient

# Bower:
bower install imboclient
```

## Version note
Imbo 1.0 and up requires imboclient-js >= 2.1.0

Imbo 0.3.3 and below requires imboclient-js <= 2.0.2

## Basic usage

```javascript
var Imbo   = require('imboclient'),
    client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>'),
    path   = '/path/to/image.jpg';

client.addImage(path, function(err, imageIdentifier) {
    if (err) {
        return console.error('Oh no, an error occured: ' + err);
    }

    console.log('Image added! Image identifier: ' + imageIdentifier);

    // Grab a transformed URL
    var url = client.getImageUrl(imageIdentifier)
        .maxSize({ 'width': 320 })
        .sepia()
        .border({ 'color': 'BF1942', 'width': 4 });

    console.log('URL to transformed image: ' + url.toString());

    // Edit the metadata of the image
    client.editMetadata(imageIdentifier, {
        'title': 'Cat in the sun',
        'description': 'A cat relaxing in Santorini, Greece'
    });
});
```

See the [documentation](http://imboclient-js.readthedocs.org/) for more details on how to use the client.

## Documentation
Documentation is available at http://imboclient-js.readthedocs.org/.

## More examples
Check out the `examples` folder for a few intros on how to use the client.

## License
Copyright (c) 2011-2015, Espen Hovlandsdal <espen@hovlandsdal.com>

Licensed under the MIT License

[1]: https://img.shields.io/npm/v/imboclient.svg?style=flat-square
[2]: http://browsenpm.org/package/imboclient
[3]: https://img.shields.io/travis/imbo/imboclient-js/master.svg?style=flat-square
[4]: https://travis-ci.org/imbo/imboclient-js
[5]: https://img.shields.io/david/imbo/imboclient-js.svg
[6]: https://david-dm.org/imbo/imboclient-js
