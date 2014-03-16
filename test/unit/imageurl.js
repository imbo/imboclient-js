var Imbo   = require('../../'),
    assert = require('assert'),
    catMd5 = '61da9892205a0d5077a353eb3487e8c8';

require('should');

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
            url.autoRotate().toString().should.include('?t%5B%5D=autoRotate');
        });
    });

    describe('#border', function() {
        it('should return correct transformation', function() {
            url.border({ color: 'c00c00', width: 13, height: 37 }).toString().should.include('?t%5B%5D=border%3Acolor%3Dc00c00%2Cwidth%3D13%2Cheight%3D37');
        });

        it('should strip the hash-symbol from colors', function() {
            url.border({ color: '#c00c00' }).toString().should.include('?t%5B%5D=border%3Acolor%3Dc00c00%2Cwidth%3D1%2Cheight%3D1');
        });

        it('should add default parameters if missing', function() {
            url.border().toString().should.include('?t%5B%5D=border%3Acolor%3D000000%2Cwidth%3D1%2Cheight%3D1');
            url.reset();

            url.border({ color: 'ffffff'}).toString().should.include('?t%5B%5D=border%3Acolor%3Dffffff%2Cwidth%3D1%2Cheight%3D1');
            url.reset();

            url.border({ color: 'f00baa', width: 5 }).toString().should.include('?t%5B%5D=border%3Acolor%3Df00baa%2Cwidth%3D5%2Cheight%3D1');
            url.reset();

            url.border({ color: 'f00baa', height: 5 }).toString().should.include('?t%5B%5D=border%3Acolor%3Df00baa%2Cwidth%3D1%2Cheight%3D5');
            url.reset();
        });
    });

    describe('#canvas', function() {
        it('should return correct transformation', function() {
            url.canvas({ width: 120, height: 130 }).toString().should.include('?t%5B%5D=canvas');
        });

        it('should strip the hash-symbol from colors', function() {
            url.canvas({ width: 120, height: 130, bg: '#c00c00' }).toString().should.include('bg%3Dc00c00');
        });

        it('should include the mode, if passed', function() {
            url.canvas({ width: 120, height: 130, mode: 'center' }).toString().should.include('mode%3Dcenter');
        });

        it('should include the x and y positions, if passed', function() {
            url.canvas({ width: 130, height: 130, x: 10, y: 20 }).toString().should.include('x%3D10%2Cy%3D20');
        });

        it('should return correct transformation with all params present', function() {
            url
                .canvas({ width: 130, height: 130, x: 10, y: 20, mode: 'free', bg: 'f00baa' })
                .toString()
                .should
                .include('?t%5B%5D=canvas%3Awidth%3D130%2Cheight%3D130%2Cmode%3Dfree%2Cx%3D10%2Cy%3D20%2Cbg%3Df00baa');
        });

        it('should throw an error if width and height is not present', function() {
            assert.throws(function() { url.canvas(); }, Error);
        });

        it('should throw an error if width is not present', function() {
            assert.throws(function() { url.canvas({ height: 130 }); }, Error);
        });

        it('should throw an error if height is not present', function() {
            assert.throws(function() { url.canvas({ width: 188 }); }, Error);
        });
    });

    describe('#compress', function() {
        it('should return correct transformation', function() {
            url.compress({ level: 90 }).toString().should.include('?t%5B%5D=compress%3Alevel%3D90');
        });

        it('should allow being passed an integer instead of an object', function() {
            url.compress(85).toString().should.include('?t%5B%5D=compress%3Alevel%3D85');
        });

        it('should handle non-integers correctly', function() {
            url.compress('40').toString().should.include('?t%5B%5D=compress%3Alevel%3D40');
        });

        it('should add default parameters if missing', function() {
            url.compress().toString().should.include('t%5B%5D=compress%3Alevel%3D75');
            url.reset();

            url.compress({}).toString().should.include('t%5B%5D=compress%3Alevel%3D75');
        });
    });

    describe('#convert', function() {
        it('should append the given filetype to the URL', function() {
            url.convert('png').toString().should.include('.png');
        });
    });

    describe('#crop', function() {
        it('should throw an error if no x/y is provided without a mode', function() {
            assert.throws(function() { url.crop({  }); }, Error);
        });

        it('should throw an error if no y is provided with mode set to center-x', function() {
            assert.throws(function() { url.crop({ mode: 'center-x' }); }, Error);
        });

        it('should throw an error if no x is provided with mode set to center-y', function() {
            assert.throws(function() { url.crop({ mode: 'center-y' }); }, Error);
        });

        it('should throw an error if width is not provided', function() {
            assert.throws(function() { url.crop({ y: 5, x: 5, mode: 'free', height: 50 }); }, Error);
        });

        it('should throw an error if height is not provided', function() {
            assert.throws(function() { url.crop({ y: 5, x: 5, mode: 'free', width: 50 }); }, Error);
        });

        it('should throw an error if neither width or height is provided', function() {
            assert.throws(function() { url.crop({ y: 5, x: 5, mode: 'free' }); }, Error);
        });

        it('should return correct transformation', function() {
            url
                .crop({ x: 5, y: 6, mode: 'free', width: 50, height: 60 })
                .toString()
                .should
                .include('?t%5B%5D=crop%3Awidth%3D50%2Cheight%3D60%2Cx%3D5%2Cy%3D6');
        });
    });

    describe('#desaturate', function() {
        it('should return correct transformation', function() {
            url.desaturate().toString().should.include('?t%5B%5D=desaturate');
        });
    });

    describe('#flipHorizontally', function() {
        it('should return correct transformation', function() {
            url.flipHorizontally().toString().should.include('?t%5B%5D=flipHorizontally');
        });
    });

    describe('#flipVertically', function() {
        it('should return correct transformation', function() {
            url.flipVertically().toString().should.include('?t%5B%5D=flipVertically');
        });
    });

    describe('#maxSize', function() {
        it('should return correct transformation if passed both width and height', function() {
            url.maxSize({ width: 320, height: 240 }).toString().should.include('?t%5B%5D=maxSize%3Awidth%3D320%2Cheight%3D240');
        });

        it('should handle being passed only a width', function() {
            url.maxSize({ width: 320 }).toString().should.include('?t%5B%5D=maxSize%3Awidth%3D320');
        });

        it('should handle being passed only a height', function() {
            url.maxSize({ height: 240 }).toString().should.include('?t%5B%5D=maxSize%3Aheight%3D240');
        });

        it('should throw an error if neither width or height is provided', function() {
            assert.throws(function() { url.maxSize({ }); }, Error);
        });
    });

    describe('#modulate', function() {
        it('should return correct transformation given all parameters', function() {
            url
                .modulate({ brightness: 14, saturation: 23, hue: 88 })
                .toString()
                .should
                .include('?t%5B%5D=modulate%3Ab%3D14%2Cs%3D23%2Ch%3D88');
        });

        it('should handle being passed only a brightness', function() {
            url.modulate({ brightness: 320 }).toString().should.include('?t%5B%5D=modulate%3Ab%3D320&');
        });

        it('should handle being passed only a saturation', function() {
            url.modulate({ saturation: 240 }).toString().should.include('?t%5B%5D=modulate%3As%3D240&');
        });

        it('should handle being passed only a hue', function() {
            url.modulate({ hue: 777 }).toString().should.include('?t%5B%5D=modulate%3Ah%3D777&');
        });

        it('should throw an error if neither brightness, saturation or hue is specified', function() {
            assert.throws(function() { url.modulate({ }); }, Error);
        });
    });

    describe('#progressive', function() {
        it('should return correct transformation', function() {
            url.progressive().toString().should.include('?t%5B%5D=progressive');
        });
    });

    describe('#resize', function() {
        it('should return correct transformation if passed both width and height', function() {
            url.resize({ width: 320, height: 240 }).toString().should.include('?t%5B%5D=resize%3Awidth%3D320%2Cheight%3D240');
        });

        it('should handle being passed only a width', function() {
            url.resize({ width: 320 }).toString().should.include('?t%5B%5D=resize%3Awidth%3D320&');
        });

        it('should handle being passed only a height', function() {
            url.resize({ height: 240 }).toString().should.include('?t%5B%5D=resize%3Aheight%3D240&');
        });

        it('should throw an error if neither width or height is provided', function() {
            assert.throws(function() { url.resize({ }); }, Error);
        });
    });

    describe('#rotate', function() {
        it('should throw an error if angle is not a number', function() {
            assert.throws(function() { url.rotate({ angle: 'foo' }); }, Error);
        });

        it('should allow a custom background color', function() {
            url.rotate({ angle: -45, bg: 'f00baa' }).toString().should.include('?t%5B%5D=rotate%3Aangle%3D-45%2Cbg%3Df00baa');
        });

        it('should default to a black background color', function() {
            url.rotate({ angle: 30 }).toString().should.include('?t%5B%5D=rotate%3Aangle%3D30%2Cbg%3D000000');
        });

        it('should handle angles with decimals', function() {
            url.rotate({ angle: 13.37 }).toString().should.include('?t%5B%5D=rotate%3Aangle%3D13.37%2Cbg%3D000000');
        });

        it('should strip the hash-symbol from colors', function() {
            url.rotate({ angle: 51, bg: '#c00c00' }).toString().should.include('?t%5B%5D=rotate%3Aangle%3D51%2Cbg%3Dc00c00');
        });
    });

    describe('#sepia', function() {
        it('should return correct transformation', function() {
            url.sepia({ threshold: 90 }).toString().should.include('?t%5B%5D=sepia%3Athreshold%3D90');
        });

        it('should handle being passed an integer instead of an object', function() {
            url.sepia(36).toString().should.include('?t%5B%5D=sepia%3Athreshold%3D36');
        });

        it('should handle non-integers correctly', function() {
            url.sepia('40').toString().should.include('?t%5B%5D=sepia%3Athreshold%3D40');
        });

        it('should add default parameters if missing', function() {
            url.sepia().toString().should.include('t%5B%5D=sepia%3Athreshold%3D80');

            url.reset();

            url.sepia({}).toString().should.include('t%5B%5D=sepia%3Athreshold%3D80');
        });
    });

    describe('#strip', function() {
        it('should return correct transformation', function() {
            url.strip().toString().should.include('?t%5B%5D=strip');
        });
    });

    describe('#thumbnail', function() {
        it('should use default arguments if none are given', function() {
            url.thumbnail().toString().should.include('?t%5B%5D=thumbnail%3Awidth%3D50%2Cheight%3D50%2Cfit%3Doutbound');

            url.reset();
            url.thumbnail({}).toString().should.include('?t%5B%5D=thumbnail%3Awidth%3D50%2Cheight%3D50%2Cfit%3Doutbound');
        });

        it('should allow custom arguments', function() {
            url.thumbnail({ width: 150, height: 100, fit: 'inset' }).toString().should.include('?t%5B%5D=thumbnail%3Awidth%3D150%2Cheight%3D100%2Cfit%3Dinset');
        });
    });

    describe('#transpose', function() {
        it('should return correct transformation', function() {
            url.transpose().toString().should.include('?t%5B%5D=transpose');
        });
    });

    describe('#transverse', function() {
        it('should return correct transformation', function() {
            url.transverse().toString().should.include('?t%5B%5D=transverse');
        });
    });

    describe('#watermark', function() {
        it('should return correct transformation', function() {
            url.watermark().toString().should.include(
                '?t%5B%5D=watermark' + encodeURIComponent(':position=top-left,x=0,y=0')
            );

            url.reset();

            url.watermark({}).toString().should.include(
                '?t%5B%5D=watermark' + encodeURIComponent(':position=top-left,x=0,y=0')
            );
        });

        it('should include imageIdentifier, if passed', function() {
            url.watermark({ imageIdentifier: catMd5 }).toString().should.include('img%3D' + catMd5);
        });

        it('should include width, if passed', function() {
            url.watermark({ width: 50 }).toString().should.include('width%3D50');
        });

        it('should include height, if passed', function() {
            url.watermark({ height: 120 }).toString().should.include('height%3D120');
        });

        it('should use the passed position mode', function() {
            url.watermark({ position: 'bottom-left'}).toString().should.include('position%3Dbottom-left');
        });

        it('should use the passed x and y coordinates', function() {
            url.watermark({ x: 66, y: 77 })
                .toString()
                .should
                .include('x%3D66%2Cy%3D77');
        });

        it('should generate correct transformation with all arguments set', function() {
            url
                .watermark({
                    imageIdentifier: catMd5,
                    width: 33,
                    height: 44,
                    position: 'center',
                    x: 55,
                    y: 66
                })
                .toString()
                .should
                .include('?t%5B%5D=watermark' + encodeURIComponent(
                    ':position=center,x=55,y=66,img=' + catMd5 + ',width=33,height=44'
                ));
        });
    });

    describe('#gif', function() {
        it('should append .gif to the URL', function() {
            url.gif().toString().should.include('.gif');
        });
    });

    describe('#jpg', function() {
        it('should append .jpg to the URL', function() {
            url.jpg().toString().should.include('.jpg');
        });
    });

    describe('#png', function() {
        it('should append .png to the URL', function() {
            url.png().toString().should.include('.png');
        });
    });

    describe('#reset', function() {
        it('should remove all transformations', function() {
            var original = url.toString();
            assert.equal(original, url.png().flipHorizontally().thumbnail().reset().toString());
        });
    });

    describe('#append', function() {
        it('should append to the transformations array', function() {
            url.append('custom:foo=bar').toString().should.include('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t%5B%5D=custom%3Afoo%3Dbar');
        });
    });

    describe('#getTransformations', function() {
        it('should return an empty array if no transformations have been applied', function() {
            url.getTransformations().length.should.equal(0);
        });

        it('should return the same number of applied transformations', function() {
            url
                .flipHorizontally()
                .flipVertically()
                .flipHorizontally();

            url.getTransformations().length.should.equal(3);
        });

        it('should not include convert(), gif(), jpg() or png() transformations', function() {
            url
                .convert('gif')
                .flipHorizontally()
                .jpg()
                .flipVertically()
                .png()
                .strip()
                .gif();

            url.getTransformations().length.should.equal(3);
        });

        it('should return array of applied transformations in applied order', function() {
            url
                .flipHorizontally()
                .flipVertically()
                .strip();

            var transformations = url.getTransformations();
            transformations[0].should.equal('flipHorizontally');
            transformations[1].should.equal('flipVertically');
            transformations[2].should.equal('strip');
        });

        it('should return transformations that are not URL-encoded', function() {
            url
                .maxSize({ width: 66, height: 77 })
                .rotate({ angle: 19, bg: 'bf1942' });

            var transformations = url.getTransformations();
            transformations[0].should.equal('maxSize:width=66,height=77');
            transformations[1].should.equal('rotate:angle=19,bg=bf1942');
        });
    });

    describe('#getQueryString', function() {
        it('should be empty string when there are no transformations', function() {
            url.getQueryString().should.equal('');
        });

        it('should be able to construct query with existing params', function() {
            var u = new Imbo.ImageUrl({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                imageIdentifier: catMd5,
                queryString: 'foo=bar&moo=tools'
            });

            u.transverse().flipHorizontally().getQueryString().should.equal('foo=bar&moo=tools&t[]=transverse&t[]=flipHorizontally');
        });

        it('should generate unencoded URLs by default', function() {
            url.append('someTransformation:foo=bar,other=thing').getQueryString().should.equal('t[]=someTransformation:foo=bar,other=thing');
        });

        it('should generate unencoded URLs if told to do so', function() {
            url.append('someTransformation:foo=bar,other=thing').getQueryString(false).should.equal('t[]=someTransformation:foo=bar,other=thing');
        });

        it('should generate encoded URLs if told to do so', function() {
            url.append('someTransformation:foo=bar,other=thing').getQueryString(true).should.equal('t%5B%5D=someTransformation%3Afoo%3Dbar%2Cother%3Dthing');
        });
    });

    describe('#getUrl', function() {
        it('should contain the base URL', function() {
            url.getUrl().should.include(baseUrl);
        });

        it('should generate the correct URL with no transformations', function() {
            url.getUrl().should.include('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8');
        });

        it('should generate the correct URL with transformations', function() {
            url.flipVertically().getUrl().should.include('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t%5B%5D=flipVertically');
        });

        it('should generate correct URL-encoded URLs for advanced combinations', function() {
            url.flipVertically().maxSize({ width: 123, height: 456 }).border({ color: '#bf1942' }).getUrl().should.equal('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t%5B%5D=flipVertically&t%5B%5D=maxSize%3Awidth%3D123%2Cheight%3D456&t%5B%5D=border%3Acolor%3Dbf1942%2Cwidth%3D1%2Cheight%3D1%2Cmode%3Doutbound&accessToken=9258d52a05c40a6ca82e69a435a510855506caf565845f2c7bed863e2bb3f25b');
        });

        it('should generate correct access tokens for various urls', function() {
            url.flipVertically().maxSize({ width: 123, height: 456 }).border({ color: '#bf1942' }).getUrl().should.include('accessToken=9258d52a05c40a6ca82e69a435a510855506caf565845f2c7bed863e2bb3f25b');
            url.reset().thumbnail({ width: 123, height: 456 }).flipHorizontally().canvas({ width: 150, height: 160, mode: 'inset', x: 17, y: 18, bg: 'c0ff83' }).getUrl().should.include('accessToken=0eabe01f6897360b5da05b9450b9e236fc6ff4e8408f541dc950cff5fdb97a3b');

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
                .thumbnail({ width: 100, height: 90, fit: 'inbound' })
                .transpose()
                .transverse()
                .watermark({ imageIdentifier: catMd5, width: 44, height: 55, position: 'top-left', x: 11, y: 22 })
                .getUrl()
                .should.include('accessToken=71b10b6e437ff1750a32f290c7ea072299b35f0fb87a4c2dd629fbd66ff730fb');
        });
    });

    describe('#toString', function() {
        it('should alias getUrl()', function() {
            url.thumbnail();
            url.toString().should.equal(url.getUrl());
        });
    });

});
