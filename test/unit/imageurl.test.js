'use strict';

var Imbo = require('../../'),
    assert = require('assert');

var catMd5 = '61da9892205a0d5077a353eb3487e8c8';

function assertUrlContains(url, shouldContain) {
    var normalized = decodeURIComponent(url.toString());

    assert(
        normalized.indexOf(normalized) > -1,
        'Expected "' + normalized + '" to contain "' + shouldContain + '"'
    );
}

describe('Imbo.ImageUrl', function() {
    var baseUrl = 'http://imbo',
        pub = 'pub',
        priv = 'priv',
        url = new Imbo.ImageUrl({
            baseUrl: baseUrl,
            publicKey: pub,
            privateKey: priv,
            imageIdentifier: catMd5
        });

    beforeEach(function() {
        url.reset();
    });

    describe('#autoRotate', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.autoRotate(), '?t[]=autoRotate');
        });
    });

    describe('#border', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.border({ color: 'c00c00', width: 13, height: 37 }), '?t[]=border:color=c00c00,width=13,height=37');
        });

        it('should strip the hash-symbol from colors', function() {
            assertUrlContains(url.border({ color: '#c00c00' }), '?t[]=border:color=c00c00,width=1,height=1');
        });

        it('should add default parameters if missing', function() {
            assertUrlContains(url.border(), '?t[]=border:color=000000,width=1,height=1');
            url.reset();

            assertUrlContains(url.border({ color: 'ffffff'}), '?t[]=border:color=ffffff,width=1,height=1');
            url.reset();

            assertUrlContains(url.border({ color: 'f00baa', width: 5 }), '?t[]=border:color=f00baa,width=5,height=1');
            url.reset();

            assertUrlContains(url.border({ color: 'f00baa', height: 5 }), '?t[]=border:color=f00baa,width=1,height=5');
            url.reset();
        });
    });

    describe('#canvas', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.canvas({ width: 120, height: 130 }), '?t[]=canvas');
        });

        it('should strip the hash-symbol from colors', function() {
            assertUrlContains(url.canvas({ width: 120, height: 130, bg: '#c00c00' }), 'bg=c00c00');
        });

        it('should containEql the mode, if passed', function() {
            assertUrlContains(url.canvas({ width: 120, height: 130, mode: 'center' }), 'mode=center');
        });

        it('should containEql the x and y positions, if passed', function() {
            assertUrlContains(url.canvas({ width: 130, height: 130, x: 10, y: 20 }), 'x=10,y=20');
        });

        it('should return correct transformation with all params present', function() {
            assertUrlContains(
                url.canvas({ width: 130, height: 130, x: 10, y: 20, mode: 'free', bg: 'f00baa' }),
                '?t[]=canvas:width=130,height=130,mode=free,x=10,y=20,bg=f00baa'
            );
        });

        it('should throw an error if width and height is not present', function() {
            assert.throws(function() {
                url.canvas();
            }, Error);
        });

        it('should throw an error if width is not present', function() {
            assert.throws(function() {
                url.canvas({ height: 130 });
            }, Error);
        });

        it('should throw an error if height is not present', function() {
            assert.throws(function() {
                url.canvas({ width: 188 });
            }, Error);
        });
    });

    describe('#compress', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.compress({ level: 90 }), '?t[]=compress:level=90');
        });

        it('should allow being passed an integer instead of an object', function() {
            assertUrlContains(url.compress(85), '?t[]=compress:level=85');
        });

        it('should handle non-integers correctly', function() {
            assertUrlContains(url.compress('40'), '?t[]=compress:level=40');
        });

        it('should add default parameters if missing', function() {
            assertUrlContains(url.compress(), 't[]=compress:level=75');
            url.reset();

            assertUrlContains(url.compress({}), 't[]=compress:level=75');
        });
    });

    describe('#contrast', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.contrast(), '?t[]=contrast');
        });

        it('should handle sharpen', function() {
            assertUrlContains(url.contrast({ sharpen: 3 }), '?t[]=contrast:sharpen=3');
        });
    });

    describe('#convert', function() {
        it('should append the given filetype to the URL', function() {
            assertUrlContains(url.convert('png'), '.png');
        });
    });

    describe('#crop', function() {
        it('should throw an error if no x/y is provided without a mode', function() {
            assert.throws(function() {
                url.crop({});
            }, Error);

            assert.throws(function() {
                url.crop({ x: 13 });
            }, Error);

            assert.throws(function() {
                url.crop({ y: 18 });
            }, Error);
        });

        it('should throw an error if no y is provided with mode set to center-x', function() {
            assert.throws(function() {
                url.crop({ mode: 'center-x' });
            }, Error);
        });

        it('should throw an error if no x is provided with mode set to center-y', function() {
            assert.throws(function() {
                url.crop({ mode: 'center-y' });
            }, Error);
        });

        it('should throw an error if width is not provided', function() {
            assert.throws(function() {
                url.crop({ y: 5, x: 5, mode: 'free', height: 50 });
            }, Error);
        });

        it('should throw an error if height is not provided', function() {
            assert.throws(function() {
                url.crop({ y: 5, x: 5, mode: 'free', width: 50 });
            }, Error);
        });

        it('should throw an error if neither width or height is provided', function() {
            assert.throws(function() {
                url.crop({ y: 5, x: 5, mode: 'free' });
            }, Error);
        });

        it('should throw an error if no options are provided', function() {
            assert.throws(function() {
                url.crop();
            }, Error);
        });

        it('should not include non-numeric options', function() {
            assertUrlContains(
                url.crop({
                    mode: 'center',
                    width: 15,
                    height: 16,
                    x: 'wat'
                }),
                '?t[]=crop:width=15,height=16,mode=center'
            );
        });

        it('should return correct transformation', function() {
            assertUrlContains(
                url.crop({ x: 5, y: 6, mode: 'free', width: 50, height: 60 }),
                '?t[]=crop:width=50,height=60,x=5,y=6,mode=free'
            );
        });

        it('should not include mode if not specified', function() {
            assertUrlContains(
                url.crop({ x: 5, y: 6, width: 50, height: 60 }),
                '?t[]=crop:width=50,height=60,x=5,y=6'
            );
        });
    });

    describe('#desaturate', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.desaturate(), '?t[]=desaturate');
        });
    });

    describe('#flipHorizontally', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.flipHorizontally(), '?t[]=flipHorizontally');
        });
    });

    describe('#flipVertically', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.flipVertically(), '?t[]=flipVertically');
        });
    });

    describe('#maxSize', function() {
        it('should return correct transformation if passed both width and height', function() {
            assertUrlContains(url.maxSize({ width: 320, height: 240 }), '?t[]=maxSize:width=320,height=240');
        });

        it('should handle being passed only a width', function() {
            assertUrlContains(url.maxSize({ width: 320 }), '?t[]=maxSize:width=320');
        });

        it('should handle being passed only a height', function() {
            assertUrlContains(url.maxSize({ height: 240 }), '?t[]=maxSize:height=240');
        });

        it('should throw an error if neither width or height is provided', function() {
            assert.throws(function() {
                url.maxSize({ });
            }, Error);
        });
    });

    describe('#modulate', function() {
        it('should return correct transformation given all parameters', function() {
            assertUrlContains(
                url.modulate({ brightness: 14, saturation: 23, hue: 88 }),
                '?t[]=modulate:b=14,s=23,h=88'
            );
        });

        it('should handle shorthand parameters', function() {
            assertUrlContains(
                url.modulate({ b: 7, s: 8, h: 9 }),
                '?t[]=modulate:b=7,s=8,h=9'
            );
        });

        it('should handle being passed only a brightness', function() {
            assertUrlContains(url.modulate({ brightness: 320 }), '?t[]=modulate:b=320&');
        });

        it('should handle being passed only a saturation', function() {
            assertUrlContains(url.modulate({ saturation: 240 }), '?t[]=modulate:s=240&');
        });

        it('should handle being passed only a hue', function() {
            assertUrlContains(url.modulate({ hue: 777 }), '?t[]=modulate:h=777&');
        });

        it('should throw an error if neither brightness, saturation or hue is specified', function() {
            assert.throws(function() {
                url.modulate({ });
            }, Error);

            assert.throws(function() {
                url.modulate();
            }, Error);
        });
    });

    describe('#progressive', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.progressive(), '?t[]=progressive');
        });
    });

    describe('#resize', function() {
        it('should return correct transformation if passed both width and height', function() {
            assertUrlContains(url.resize({ width: 320, height: 240 }), '?t[]=resize:width=320,height=240');
        });

        it('should handle being passed only a width', function() {
            assertUrlContains(url.resize({ width: 320 }), '?t[]=resize:width=320&');
        });

        it('should handle being passed only a height', function() {
            assertUrlContains(url.resize({ height: 240 }), '?t[]=resize:height=240&');
        });

        it('should throw an error if neither width or height is provided', function() {
            assert.throws(function() {
                url.resize({ });
            }, Error);
        });
    });

    describe('#rotate', function() {
        it('should throw an error if angle is not a number', function() {
            assert.throws(function() {
                url.rotate({ angle: 'foo' });
            }, Error);
        });

        it('should allow a custom background color', function() {
            assertUrlContains(url.rotate({ angle: -45, bg: 'f00baa' }), '?t[]=rotate:angle=-45,bg=f00baa');
        });

        it('should default to a black background color', function() {
            assertUrlContains(url.rotate({ angle: 30 }), '?t[]=rotate:angle=30,bg=000000');
        });

        it('should handle angles with decimals', function() {
            assertUrlContains(url.rotate({ angle: 13.37 }), '?t[]=rotate:angle=13.37,bg=000000');
        });

        it('should strip the hash-symbol from colors', function() {
            assertUrlContains(url.rotate({ angle: 51, bg: '#c00c00' }), '?t[]=rotate:angle=51,bg=c00c00');
        });
    });

    describe('#sepia', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.sepia({ threshold: 90 }), '?t[]=sepia:threshold=90');
        });

        it('should handle being passed an integer instead of an object', function() {
            assertUrlContains(url.sepia(36), '?t[]=sepia:threshold=36');
        });

        it('should handle non-integers correctly', function() {
            assertUrlContains(url.sepia('40'), '?t[]=sepia:threshold=40');
        });

        it('should add default parameters if missing', function() {
            assertUrlContains(url.sepia(), 't[]=sepia:threshold=80');

            url.reset();

            assertUrlContains(url.sepia({}), 't[]=sepia:threshold=80');
        });
    });

    describe('#sharpen', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.sharpen(), '?t[]=sharpen');
        });

        it('should handle presets', function() {
            assertUrlContains(url.sharpen({ preset: 'extreme' }), '?t[]=sharpen:preset=extreme');
        });

        it('should handle radius', function() {
            assertUrlContains(url.sharpen({ radius: 3 }), '?t[]=sharpen:radius=3');
        });

        it('should handle sigma', function() {
            assertUrlContains(url.sharpen({ sigma: 2 }), '?t[]=sharpen:sigma=2');
        });

        it('should handle gain', function() {
            assertUrlContains(url.sharpen({ gain: 1.5 }), '?t[]=sharpen:gain=1.5');
        });

        it('should handle threshold', function() {
            assertUrlContains(url.sharpen({ threshold: 0.07 }), '?t[]=sharpen:threshold=0.07');
        });
    });

    describe('#smartSize', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.smartSize({ width: 320, height: 240 }), '?t[]=smartSize:width=320,height=240');
        });

        it('should handle coordinate array', function() {
            assertUrlContains(url.smartSize({ width: 320, height: 240, poi: [1, '2'] }), '?t[]=smartSize:width=320,height=240,poi=1,2');
        });

        it('should handle coordinate object', function() {
            assertUrlContains(url.smartSize({ width: 320, height: 240, poi: { x: 151, y: 212} }), '?t[]=smartSize:width=320,height=240,poi=151,212');
        });

        it('should throw on missing width/height', function() {
            assert.throws(function() {
                url.smartSize();
            }, Error);

            assert.throws(function() {
                url.smartSize({ height: 240 });
            }, /width/i);

            assert.throws(function() {
                url.smartSize({ width: 320 });
            }, /width/i);
        });

        it('should throw on incorrect POI format', function() {
            assert.throws(function() {
                url.smartSize({ width: 320, height: 240, poi: 'wat' });
            }, /poi/i);

            assert.throws(function() {
                url.smartSize({ width: 320, height: 240, poi: {} });
            }, /poi/i);

            assert.throws(function() {
                url.smartSize({ width: 320, height: 240, poi: { x: 3 } });
            }, /poi/i);

            assert.throws(function() {
                url.smartSize({ width: 320, height: 240, poi: { y: 5 } });
            }, /poi/i);
        });

        it('should throw on incorrect crop value', function() {
            assert.throws(function() {
                url.smartSize({ width: 320, height: 240, crop: 'wat' });
            }, /crop/i);
        });
    });

    describe('#strip', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.strip(), '?t[]=strip');
        });
    });

    describe('#thumbnail', function() {
        it('should use default arguments if none are given', function() {
            assertUrlContains(url.thumbnail(), '?t[]=thumbnail:width=50,height=50,fit=outbound');

            url.reset();
            assertUrlContains(url.thumbnail({}), '?t[]=thumbnail:width=50,height=50,fit=outbound');
        });

        it('should allow custom arguments', function() {
            assertUrlContains(url.thumbnail({ width: 150, height: 100, fit: 'inset' }), '?t[]=thumbnail:width=150,height=100,fit=inset');
        });
    });

    describe('#transpose', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.transpose(), '?t[]=transpose');
        });
    });

    describe('#transverse', function() {
        it('should return correct transformation', function() {
            assertUrlContains(url.transverse(), '?t[]=transverse');
        });
    });

    describe('#watermark', function() {
        it('should return correct transformation', function() {
            assertUrlContains(
                url.watermark(),
                '?t[]=watermark:position=top-left,x=0,y=0'
            );

            url.reset();

            assertUrlContains(
                url.watermark({}),
                '?t[]=watermark:position=top-left,x=0,y=0'
            );
        });

        it('should containEql imageIdentifier, if passed', function() {
            assertUrlContains(url.watermark({ imageIdentifier: catMd5 }), 'img=' + catMd5);
        });

        it('should containEql width, if passed', function() {
            assertUrlContains(url.watermark({ width: 50 }), 'width=50');
        });

        it('should containEql height, if passed', function() {
            assertUrlContains(url.watermark({ height: 120 }), 'height=120');
        });

        it('should use the passed position mode', function() {
            assertUrlContains(url.watermark({ position: 'bottom-left'}), 'position=bottom-left');
        });

        it('should use the passed x and y coordinates', function() {
            assertUrlContains(
                url.watermark({ x: 66, y: 77 }),
                'x=66,y=77'
            );
        });

        it('should generate correct transformation with all arguments set', function() {
            assert(
                url.watermark({
                    imageIdentifier: catMd5,
                    width: 33,
                    height: 44,
                    position: 'center',
                    x: 55,
                    y: 66
                }),
                '?t[]=watermark:position=center,x=55,y=66,img=' + catMd5 + ',width=33,height=44'
            );
        });
    });

    describe('#gif', function() {
        it('should append .gif to the URL', function() {
            assertUrlContains(url.gif(), '.gif');
        });
    });

    describe('#jpg', function() {
        it('should append .jpg to the URL', function() {
            assertUrlContains(url.jpg(), '.jpg');
        });
    });

    describe('#png', function() {
        it('should append .png to the URL', function() {
            assertUrlContains(url.png(), '.png');
        });
    });

    describe('#reset', function() {
        it('should remove all transformations', function() {
            var original = url.toString();
            assert.equal(original, url.png().flipHorizontally().thumbnail().reset().toString());
        });
    });

    describe('#clone', function() {
        it('should return a clone of itself', function() {
            url.flipHorizontally().thumbnail();

            var clone = url.clone();
            assert.equal(url.toString(), clone.toString(), 'URLs should be equal after cloning');

            clone.border();
            assert.notEqual(url.toString(), clone.toString(), 'URLs should differ after modifying clone');
        });
    });

    describe('#append', function() {
        it('should append to the transformations array', function() {
            assertUrlContains(url.append('custom:foo=bar'), 'http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t[]=custom:foo=bar');
        });
    });

    describe('#getTransformations', function() {
        it('should return an empty array if no transformations have been applied', function() {
            assert.equal(url.getTransformations().length, 0);
        });

        it('should return the same number of applied transformations', function() {
            url
                .flipHorizontally()
                .flipVertically()
                .flipHorizontally();

            assert.equal(url.getTransformations().length, 3);
        });

        it('should not containEql convert(), gif(), jpg() or png() transformations', function() {
            url
                .convert('gif')
                .flipHorizontally()
                .jpg()
                .flipVertically()
                .png()
                .strip()
                .gif();

            assert.equal(url.getTransformations().length, 3);
        });

        it('should return array of applied transformations in applied order', function() {
            url
                .flipHorizontally()
                .flipVertically()
                .strip();

            var transformations = url.getTransformations();
            assert.equal(transformations[0], 'flipHorizontally');
            assert.equal(transformations[1], 'flipVertically');
            assert.equal(transformations[2], 'strip');
        });

        it('should return transformations that are not URL-encoded', function() {
            url
                .maxSize({ width: 66, height: 77 })
                .rotate({ angle: 19, bg: 'bf1942' });

            var transformations = url.getTransformations();
            assert.equal(transformations[0], 'maxSize:width=66,height=77');
            assert.equal(transformations[1], 'rotate:angle=19,bg=bf1942');
        });
    });

    describe('#getQueryString', function() {
        it('should be empty string when there are no transformations', function() {
            assert.equal(url.getQueryString(), '');
        });

        it('should be able to construct query with existing params', function() {
            var u = new Imbo.ImageUrl({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                imageIdentifier: catMd5,
                queryString: 'foo=bar&moo=tools'
            });

            assert.equal(u.transverse().flipHorizontally().getQueryString(), 'foo=bar&moo=tools&t[]=transverse&t[]=flipHorizontally');
        });

        it('should generate unencoded URLs by default', function() {
            assert.equal(url.append('someTransformation:foo=bar,other=thing').getQueryString(), 't[]=someTransformation:foo=bar,other=thing');
        });

        it('should generate unencoded URLs if told to do so', function() {
            assert.equal(url.append('someTransformation:foo=bar,other=thing').getQueryString(false), 't[]=someTransformation:foo=bar,other=thing');
        });

        it('should generate encoded URLs if told to do so', function() {
            assert.equal(
                url.append('someTransformation:foo=bar,other=thing').getQueryString(true),
                't%5B%5D=someTransformation%3Afoo%3Dbar%2Cother%3Dthing'
            );
        });
    });

    describe('#getUrl', function() {
        it('should contain the base URL', function() {
            assertUrlContains(url.getUrl(), baseUrl);
        });

        it('should generate the correct URL with no transformations', function() {
            assertUrlContains(url.getUrl(), 'http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8');
        });

        it('should generate the correct URL with transformations', function() {
            assertUrlContains(url.flipVertically().getUrl(), 'http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t[]=flipVertically');
        });

        it('should generate correct URL-encoded URLs for advanced combinations', function() {
            assert.equal(
                url.flipVertically().maxSize({ width: 123, height: 456 }).border({ color: '#bf1942' }).getUrl(),
                'http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t%5B%5D=flipVertically&t%5B%5D=maxSize%3Awidth%3D123%2Cheight%3D456&t%5B%5D=border%3Acolor%3Dbf1942%2Cwidth%3D1%2Cheight%3D1%2Cmode%3Doutbound&accessToken=9258d52a05c40a6ca82e69a435a510855506caf565845f2c7bed863e2bb3f25b'
            );
        });

        it('should generate correct access tokens for various urls', function() {
            assertUrlContains(url.flipVertically().maxSize({ width: 123, height: 456 }).border({ color: '#bf1942' }).getUrl(), 'accessToken=9258d52a05c40a6ca82e69a435a510855506caf565845f2c7bed863e2bb3f25b');
            assertUrlContains(url.reset().thumbnail({ width: 123, height: 456 }).flipHorizontally().canvas({ width: 150, height: 160, mode: 'inset', x: 17, y: 18, bg: 'c0ff83' }).getUrl(), 'accessToken=0eabe01f6897360b5da05b9450b9e236fc6ff4e8408f541dc950cff5fdb97a3b');

            // Real stress-testing here...
            url
                .reset()
                .autoRotate()
                .border({ color: '#bf1942', width: 2, height: 3 })
                .canvas({ width: 15, height: 16, mode: 'inset', x: 17, y: 18, bg: 'f00' })
                .compress({ level: 77 })
                .convert('gif')
                .crop({ x: 10, y: 12, width: 140, height: 140, mode: 'center-x' })
                .desaturate()
                .flipHorizontally()
                .flipVertically()
                .maxSize({ width: 130, height: 120 })
                .modulate({ brightness: 11, saturation: 22, hue: 33 })
                .progressive()
                .resize({ width: 110, height: 100 })
                .rotate({ angle: 17.8, bg: 'c08833' })
                .sepia({ threshold: 60 })
                .strip()
                .smartSize({ width: 320, height: 240, poi: [13, 37], crop: 'close' })
                .thumbnail({ width: 100, height: 90, fit: 'inbound' })
                .transpose()
                .transverse()
                .watermark({ imageIdentifier: catMd5, width: 44, height: 55, position: 'top-left', x: 11, y: 22 });

            assertUrlContains(url, 'accessToken=71b10b6e437ff1750a32f290c7ea072299b35f0fb87a4c2dd629fbd66ff730fb');
        });
    });

    describe('#toString', function() {
        it('should alias getUrl()', function() {
            url.thumbnail();
            assert.equal(url.toString(), url.getUrl());
        });
    });

    describe('#parse', function() {
        it('should correctly parse simple URLs', function() {
            var testUrl = 'http://imbo/users/pub/images/' + catMd5;
            assertUrlContains(Imbo.ImageUrl.parse(testUrl, 'foo').toString(), testUrl + '?accessToken=');
        });

        it('should correctly parse URLs with extensions', function() {
            var testUrl = 'http://imbo/users/pub/images/' + catMd5 + '.jpg';
            assertUrlContains(Imbo.ImageUrl.parse(testUrl, 'foo').toString(), testUrl + '?accessToken=');
        });

        it('should correctly parse URLs with existing query string', function() {
            var testUrl = 'http://imbo/users/pub/images/' + catMd5 + '.jpg?custom=param';
            assertUrlContains(Imbo.ImageUrl.parse(testUrl, 'foo').toString(), testUrl + '&accessToken=');

            testUrl = 'http://imbo/users/pub/images/' + catMd5 + '?custom=param';
            assertUrlContains(Imbo.ImageUrl.parse(testUrl, 'foo').toString(), testUrl + '&accessToken=');
        });

        it('should extract correct base URLs', function() {
            var imgId = '701db186d4cfb7a0a3d83b5628f878ab',
                testUrl = 'http://imbo-some.host.no/users/pubkey/images/' + imgId;

            var imgUrl = Imbo.ImageUrl.parse(testUrl, 'foo');

            assert.equal(imgUrl.getBaseUrl(), 'http://imbo-some.host.no');
        });

        it('should correctly parse URLs with transformations', function() {
            var testUrl = 'http://imbo/users/pub/images/' + catMd5 + '.jpg',
                qs = '?t[]=flipHorizontally';

            assertUrlContains(Imbo.ImageUrl.parse(testUrl + qs, 'foo').toString(), testUrl + '?t[]=flipHorizontally');
        });

        it('should decode and put transformations in transformations array', function() {
            var testUrl = 'http://imbo/users/pub/images/' + catMd5 + '.jpg',
                qs = '?t[]=crop:x=0,y=0,width=927,height=621&t[]=thumbnail:width=320,height=214,fit=inset&t[]=canvas:width=320,height=214,mode=center';

            var imgUrl = Imbo.ImageUrl.parse(testUrl + qs, 'foo'),
                transformations = imgUrl.getTransformations(),
                expected = [
                    'crop:x=0,y=0,width=927,height=621',
                    'thumbnail:width=320,height=214,fit=inset',
                    'canvas:width=320,height=214,mode=center'
                ];

            assert.equal(transformations.length, expected.length);
            for (var i = 0; i < transformations.length; i++) {
                assert.equal(transformations[i], expected[i]);
            }
        });

        it('should decode and put transformations in transformations array (2)', function() {
            var imgId = '701db186d4cfb7a0a3d83b5628f878ab',
                testUrl = 'http://imbo-some.host.no/users/pubkey/images/' + imgId,
                qs = '?t[]=modulate:s=127&t[]=crop:width=724,height=352,x=25,y=316&t[]=maxSize:width=552&t[]=maxSize:width=225,height=225&accessToken=something';

            var imgUrl = Imbo.ImageUrl.parse(testUrl + qs, 'foo'),
                transformations = imgUrl.getTransformations(),
                expected = [
                    'modulate:s=127',
                    'crop:width=724,height=352,x=25,y=316',
                    'maxSize:width=552',
                    'maxSize:width=225,height=225'
                ];

            assert.equal(transformations.length, expected.length);
            for (var i = 0; i < transformations.length; i++) {
                assert.equal(transformations[i], expected[i]);
            }
        });

        it('should parse complex URLs with a different public key/user combination', function() {
            var testUrl = 'http://imbo/users/someuser/images/' + catMd5 + '.jpg',
                qs = '?publicKey=foobar&t[]=crop:x=0,y=0,width=927,height=621&t[]=thumbnail:width=320,height=214,fit=inset&t[]=canvas:width=320,height=214,mode=center';

            var imgUrl = Imbo.ImageUrl.parse(testUrl + qs, 'foo'),
                transformations = imgUrl.getTransformations(),
                expected = [
                    'crop:x=0,y=0,width=927,height=621',
                    'thumbnail:width=320,height=214,fit=inset',
                    'canvas:width=320,height=214,mode=center'
                ];

            assert.equal(transformations.length, expected.length);
            for (var i = 0; i < transformations.length; i++) {
                assert.equal(transformations[i], expected[i]);
            }

            assert.equal(imgUrl.getPublicKey(), 'foobar');
            assert.equal(imgUrl.getUser(), 'someuser');
        });

        it('should remove existing access token from query string', function() {
            var testUrl = 'http://imbo/users/pub/images/' + catMd5 + '.jpg?accessToken=foo';

            assert.equal(Imbo.ImageUrl.parse(testUrl, 'foo').getQueryString(), '');
        });

        it('should generate the same accessToken as a manually constructed instance', function() {
            var manual = new Imbo.ImageUrl({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                imageIdentifier: catMd5
            }).sepia();

            var parsed = Imbo.ImageUrl.parse(manual.toString(), priv);
            assert.equal(manual.toString(), parsed.toString());
            assert.equal(manual.flipVertically().toString(), parsed.flipVertically().toString());
        });
    });
});
