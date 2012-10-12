var Imbo   = require('../')
  , assert = require('assert')
  , util   = require('util')
  , catMd5 = '61da9892205a0d5077a353eb3487e8c8'
  , should = require('should')
  , undef;

describe('Imbo.Url', function() {

    var baseUrl = 'http://imbo', pub = 'pub', priv = 'priv', url = new Imbo.Url(baseUrl, pub, priv, catMd5);
    beforeEach(function() {
        url.reset();
    });

    describe('#border', function() {
        it('should return correct transformation', function() {
            url.border('c00c00', 13, 37).toString().should.include('?t[]=border:color=c00c00,width=13,height=37');
        });

        it('should strip the hash-symbol from colors', function() {
            url.border('#c00c00').toString().should.include('?t[]=border:color=c00c00,width=1,height=1');
        });

        it('should add default parameters if missing', function() {
            url.border().toString().should.include('?t[]=border:color=000000,width=1,height=1');
            url.reset();

            url.border('ffffff').toString().should.include('?t[]=border:color=ffffff,width=1,height=1');
            url.reset();

            url.border('f00baa', 5).toString().should.include('?t[]=border:color=f00baa,width=5,height=1');
            url.reset();
        });
    });

    describe('#compress', function() {
        it('should return correct transformation', function() {
            url.compress(90).toString().should.include('?t[]=compress:quality=90');
        });

        it('should handle non-integers correctly', function() {
            url.compress('40').toString().should.include('?t[]=compress:quality=40');
        });

        it('should add default parameters if missing', function() {
            url.compress().toString().should.include('?t[]=compress:quality=75');
            url.reset();
        });
    });

    describe('#convert', function() {
        it('should append the given filetype to the URL', function() {
            url.convert('png').toString().should.include('.png');
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

    describe('#crop', function() {
        it('should return correct transformation', function() {
            url.crop(0, 1, 2, 3).toString().should.include('?t[]=crop:x=0,y=1,width=2,height=3');
        });
    });

    describe('#flipHorizontally', function() {
        it('should return correct transformation', function() {
            url.flipHorizontally().toString().should.include('?t[]=flipHorizontally');
        });
    });

    describe('#flipVertically', function() {
        it('should return correct transformation', function() {
            url.flipVertically().toString().should.include('?t[]=flipVertically');
        });
    });

    describe('#resize', function() {
        it('should return correct transformation', function() {
            url.resize(320, 240).toString().should.include('?t[]=resize:width=320,height=240');
        });

        it('should handle being passed only a width', function() {
            url.resize(320).toString().should.include('?t[]=resize:width=320');
        });

        it('should handle being passed only a height', function() {
            url.resize(null, 240).toString().should.include('?t[]=resize:height=240');
        });
    });

    describe('#rotate', function() {
        it('should return an unmodified url if angle is not a number', function() {
            var original = url.toString();
            url.rotate('foo').toString().should.equal(original);
        });

        it('should allow a custom background color', function() {
            url.rotate(-45, 'f00baa').toString().should.include('?t[]=rotate:angle=-45,bg=f00baa');
        });

        it('should default to a black background color', function() {
            url.rotate(30).toString().should.include('?t[]=rotate:angle=30,bg=000000');
        });

        it('should handle angles with decimals', function() {
            url.rotate(13.37).toString().should.include('?t[]=rotate:angle=13.37,bg=000000');
        });

        it('should strip the hash-symbol from colors', function() {
            url.rotate(51, '#c00c00').toString().should.include('?t[]=rotate:angle=51,bg=c00c00');
        });
    });

    describe('#thumbnail', function() {
        it('should use default arguments if none are given', function() {
            url.thumbnail().toString().should.include('?t[]=thumbnail:width=50,height=50,fit=outbound');
        });

        it('should allow custom arguments', function() {
            url.thumbnail(150, 100, 'inset').toString().should.include('?t[]=thumbnail:width=150,height=100,fit=inset');
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
            url.append('custom:foo=bar').toString().should.include('?t[]=custom:foo=bar');
        });
    });

    describe('#getQueryString', function() {
        it('should be empty string when there are no transformations', function() {
            url.getQueryString().should.equal('');
        });

        it('should include transformation key when there are only convert-transformations', function() {
            url.png().getQueryString().should.equal('tk=4f4ceaa5d960ac8e795aff1b5bf7b3b2');
        });

        it('should include transformation key when there are transformations', function() {
            url.flipHorizontally().getQueryString().should.equal('t[]=flipHorizontally&tk=0b7477773552a0ef6a92aa9b364c47fc');
        });

        it('should contain transformations in the right order', function() {
            url.flipHorizontally().thumbnail().getQueryString().should.equal('t[]=flipHorizontally&t[]=thumbnail:width=50,height=50,fit=outbound&tk=07735c3240cbd169db28ba69e9c1db35');
        });
    });

    describe('#getUrl', function() {
        it('should contain the base URL', function() {
            url.getUrl().should.include(baseUrl);
        });

        it('should generate the correct URL with no transformations', function() {
            url.getUrl().should.equal('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8');
        });

        it('should generate the correct URL with transformations', function() {
            url.flipVertically().getUrl().should.equal('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t[]=flipVertically&tk=0411e882fe82b857012e4a3da563a278');
        });
    });

    describe('#toString', function() {
        it('should alias getUrl()', function() {
            url.thumbnail();
            url.toString().should.equal(url.getUrl());
        });
    });

});