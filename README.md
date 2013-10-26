# Javascript client for Imbo
A Javascript (node/browser) client for [Imbo](https://github.com/imbo/imbo).

[![Current build Status](https://secure.travis-ci.org/imbo/imboclient-js.png)](http://travis-ci.org/imbo/imboclient-js)

## License
Copyright (c) 2011-2013, Espen Hovlandsdal <espen@hovlandsdal.com>

Licensed under the MIT License

## Installation
imboclient-js can be installed using [npm](https://npmjs.org/):

```
npm install imboclient
```

Bower support is coming soon.

## Usage

### Add an image
```javascript
var Imbo   = require('imboclient')
  , client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , path   = '/path/to/image.jpg';

// From Node (and local filesystem):
client.addImage(path, function(err, imageIdentifier) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Image added! Image identifier: ' + imageIdentifier);
    }
});

// OR, image from URL:
client.addImageFromUrl('http://example.com/image.png', function(err, imageIdentifier) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Image added! Image identifier: ' + imageIdentifier);
    }
});

// OR, from the browser:
fileInput.addEventListener('change', function(e) {
    client.addImage(e.files[0], function(err, imageIdentifier) {
        if (err) {
            console.error('Oh no, an error occured: ' + err);
        } else {
            console.log('Image added! Image identifier: ' + imageIdentifier);
        }
    });
}, false);
```

### Add/edit meta data
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8';

// Add some meta data to the image
var metadata = {
    'foo': 'bar',
    'bar': 'foo'
};

client.editMetadata(imageIdentifier, metadata, function(err) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Image added! Image identifier: ' + imageIdentifier);
    }
});
```

### Get meta data
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8';

client.getMetadata(imageIdentifier, function(err, metadata) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Here's the metadata: ', metadata);
    }
});
```

### Delete an image
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8';

client.deleteImageByIdentifier(imageIdentifier, function(err) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Image deleted!');
    }
});
```

### Delete all meta data attached to an image
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8';

client.deleteMetadata(imageIdentifier, function(err) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Metadata deleted!');
    }
});
```

### Replace existing meta data attached to an image
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8'
  , metadata = { 'all-new': 'metadata' };

client.replaceMetadata(imageIdentifier, metadata, function(err) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else {
        console.log('Metadata replaced!');
    }
});
```

### Check if a local image exists on server
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , path = '/path/to/image.jpg;

client.imageExist(path, function(err, exists)) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else if (exists) {
        console.log('Image exists on server!');
    } else {
        console.log('Image does NOT exist on server!');
    }
});
```

### Check if an image identifier exists on server
```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8';

client.imageIdentifierExists(imageIdentifier, function(err, exists) {
    if (err) {
        console.error('Oh no, an error occured: ' + err);
    } else if (exists) {
        console.log('Image exists on server!');
    } else {
        console.log('Image does NOT exist on server!');
    }
});
```

### Generate image URLs

`Imbo.Url` implements some methods that can be used to easily add transformations to an image URL. All these methods can be chained and the transformations will be applied to the URL in the chained order.

The `convert()` method is special in that it does not append anything to the URL, except injects an image extension to the image identifier. `convert()` (and `gif()`, `jpg()` and `png()` which proxies to `convert()`) can therefore be added anywhere in the chain.

Here's an example of how we can use it to resize an image while maintaining aspect ratio, then adding a border and outputting it in PNG format:

```javascript
var client = new Imbo.Client('http://<hostname>', '<publicKey>', '<privateKey>')
  , imageIdentifier = '61da9892205a0d5077a353eb3487e8c8';

// Generate an image URL and add some transformations
var imageUrl    = client.getImageUrl(imageIdentifier)
  , transformed = imageUrl.maxSize(320, 240).border('f00baa', 2, 2).png();

// Add an img-element to the body with the transformed URL
var img = document.createElement('img');
img.setAttribute('src', imageUrl.toString());
document.body.appendChild(img);
```

The transformations that can be chained are:

**border()**

Add a border around the image.

* `(string) color` Color in hexadecimal. Defaults to '000000' (also supports short values like 'f00' ('ff0000')).
* `(int) width` Width of the border on the left and right sides of the image. Defaults to 1.
* `(int) height` Height of the border on the top and bottom sides of the image. Defaults to 1.

**canvas()**

Builds a new canvas and allows easy positioning of the original image within it.

* `(int) width` Width of the new canvas.
* `(int) height` Height of the new canvas.
* `(string) mode` Placement mode. 'free' (uses `x` and `y`), 'center', 'center-x' (centers horizontally, uses `y` for vertical placement), 'center-y' (centers vertically, uses `x` for horizontal placement). Default to 'free'.
* `(int) x` X coordinate of the placement of the upper left corner of the existing image.
* `(int) y` Y coordinate of the placement of the upper left corner of the existing image.
* `(string) bg` Background color of the canvas.

**compress()**

Compress the image on the fly.

* `(int) quality` Quality of the resulting image. 100 is maximum quality (lowest compression rate)

**convert()**

Converts the image to another type.

* `(string) type` The type to convert to. Supported types are: 'gif', 'jpg' and 'png'.

**crop()**

Crop the image.

* `(int) x` The X coordinate of the cropped region's top left corner.
* `(int) y` The Y coordinate of the cropped region's top left corner.
* `(int) width` The width of the crop.
* `(int) height` The height of the crop.

**desaturate()**

Desaturates the image (essentially grayscales it).

**flipHorizontally()**

Flip the image horizontally.

**flipVertically()**

Flip the image vertically.

**gif()**

Proxies to `convert('gif')`.

**jpg()**

Proxies to `convert('jpg')`.

**maxSize()**

Resize the image using the original aspect ratio.

* `(int) width` The max width of the resulting image in pixels. If not specified the width will be calculated using the same ratio as the original image.
* `(int) height` The max height of the resulting image in pixels. If not specified the height will be calculated using the same ratio as the original image.

**png()**

Proxies to `convert('png')`.

**resize()**

Resize the image. Two parameters are supported and at least one of them must be supplied to apply this transformation.

* `(int) width` The width of the resulting image in pixels. If not specified the width will be calculated using the same ratio as the original image.
* `(int) height` The height of the resulting image in pixels. If not specified the height will be calculated using the same ratio as the original image.

**rotate()**

Rotate the image.

* `(int) angle` The number of degrees to rotate the image.
* `(string) bg` Background color in hexadecimal. Defaults to '000000' (also supports short values like 'f00' ('ff0000')).

**sepia()**

Apply a sepia color tone transformation to the image.

* `(int) threshold` Measure of the extent of the sepia toning (ranges from 0 to QuantumRange). Defaults to 80.

**thumbnail()**

Generate a thumbnail of the image.

* `(int) width` Width of the thumbnail. Defaults to 50.
* `(int) height` Height of the thumbnail. Defaults to 50.
* `(string) fit` Fit style. 'inset' or 'outbound'. Default to 'outbound'.

**transpose()**

Creates a vertical mirror image by reflecting the pixels around the central x-axis while rotating them 90-degrees.

**transverse()**

Creates a horizontal mirror image by reflecting the pixels around the central y-axis while rotating them 270-degrees.

### Support for multiple hostnames
Following the recommendation of the HTTP 1.1 specification, browsers typically default to two simultaneous requests per hostname. If you wish to generate URLs that point to a range of different hostnames, you can do this by passing an array of URLs to the client when instantiating:

```javascript
var client = new Imbo.Client([
    'http://<hostname1>',
    'http://<hostname2>',
    'http://<hostname3>',
], '<publicKey>', '<privateKey>');
```

When using `getImageUrl(imageIdentifier)`, the client will pick one of the URLs defined. The same image identifier will result in the same URL, as long as the number of URLs given does not change.

## More examples
Check out the `examples` folder for a few intros on how to use the client.
