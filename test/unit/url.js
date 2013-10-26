var Imbo   = require('../../')
  , assert = require('assert')
  , util   = require('util')
  , should = require('should')
  , catMd5 = '61da9892205a0d5077a353eb3487e8c8';

describe('Imbo.Url', function() {

    var baseUrl = 'http://imbo'
      , pub = 'pub'
      , priv = 'priv'
      , url = new Imbo.Url({
          baseUrl: baseUrl,
          publicKey: pub,
          privateKey: priv,
          imageIdentifier: catMd5
      });

    beforeEach(function() {
        url.reset();
    });

    describe('#border', function() {
        it('should return correct transformation', function() {
            url.border('c00c00', 13, 37).toString().should.include('?t[]=border%3Acolor%3Dc00c00%2Cwidth%3D13%2Cheight%3D37&accessToken=23344399b19763e260db22a40ea2e9cd0f0a68d3cd6277737932fa7b9637bc7c');
        });

        it('should strip the hash-symbol from colors', function() {
            url.border('#c00c00').toString().should.include('?t[]=border%3Acolor%3Dc00c00%2Cwidth%3D1%2Cheight%3D1&accessToken=1b09a610c831da1427306280bb518cb16eb10a172e00199c405d9d5922b7326a');
        });

        it('should add default parameters if missing', function() {
            url.border().toString().should.include('?t[]=border%3Acolor%3D000000%2Cwidth%3D1%2Cheight%3D1&accessToken=bff30f0d7e47b108c71c68d475d13aed226b7e9ce955bd1e3b1c1d3938519f8a');
            url.reset();

            url.border('ffffff').toString().should.include('?t[]=border%3Acolor%3Dffffff%2Cwidth%3D1%2Cheight%3D1&accessToken=fec56797715d24e98e1a0aa5e563fdbfc9947718bc3a1e59e31ccb4a647c3924');
            url.reset();

            url.border('f00baa', 5).toString().should.include('?t[]=border%3Acolor%3Df00baa%2Cwidth%3D5%2Cheight%3D1&accessToken=4ed17df69d3706d327d89f261a684649bb261aa328b5530360b20212e6457f26');
            url.reset();
        });
    });

    describe('#canvas', function() {
        it('should return correct transformation', function() {
            url.canvas(120, 130).toString().should.include('?t[]=canvas');
        });

        it('should strip the hash-symbol from colors', function() {
            url.canvas(120, 130, 'free', 0, 0, '#c00c00').toString().should.include('bg%3Dc00c00');
        });

        it('should include the mode, if passed', function() {
            url.canvas(120, 120, 'center').toString().should.include('mode%3Dcenter');
        });

        it('should include the x and y positions, if passed', function() {
            url.canvas(130, 130, 'center', 10, 20, '#f00baa').toString().should.include('x%3D10%2Cy%3D20')
        });
    });

    describe('#compress', function() {
        it('should return correct transformation', function() {
            url.compress(90).toString().should.include('?t[]=compress%3Aquality%3D90&accessToken=e5287cd9eabdbeb3894241c5d58812053d4a06f5e8309c139c26d74889149c17');
        });

        it('should handle non-integers correctly', function() {
            url.compress('40').toString().should.include('?t[]=compress%3Aquality%3D40&accessToken=ad3b6b35659a7a54d9ec74baa40beb266e0119e73d1d9bfbf4fc3b0298783b69');
        });

        it('should add default parameters if missing', function() {
            url.compress().toString().should.include('t[]=compress%3Aquality%3D75&accessToken=d837de15840e2457a213a83ae281497ac751e4eac82d82b23e97ce4abe478c98');
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
            url.crop(0, 1, 2, 3).toString().should.include('?t[]=crop%3Ax%3D0%2Cy%3D1%2Cwidth%3D2%2Cheight%3D3&accessToken=520c7f2e1327697a7a49945e06eb00450b62510a55b3f159cd95d99b448e158d');
        });
    });

    describe('#desaturate', function() {
        it('should return correct transformation', function() {
            url.desaturate().toString().should.include('?t[]=desaturate');
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
            url.resize(320, 240).toString().should.include('?t[]=resize%3Awidth%3D320%2Cheight%3D240&accessToken=0b2695c3f284f4b01359c37f056b658ce9897db52d3a929407e22ae9dd2f53f4');
        });

        it('should handle being passed only a width', function() {
            url.resize(320).toString().should.include('?t[]=resize%3Awidth%3D320&accessToken=1537826f842b3269650082fab6f5d2699c4fb7b9416330d9114aa23a75d6febb');
        });

        it('should handle being passed only a height', function() {
            url.resize(null, 240).toString().should.include('?t[]=resize%3Aheight%3D240&accessToken=d9c59e7deb1c70d88ae4f2d0e12978d1a9b38360b1f6e2f3bf01f8291e8a8a4c');
        });
    });

    describe('#maxSize', function() {
        it('should return correct transformation', function() {
            url.maxSize(320, 240).toString().should.include('?t[]=maxSize%3Awidth%3D320%2Cheight%3D240&accessToken=8b7e7f654a06c427285671c174349180686a6261aaf705b06bfe282e8b0a3b93');
        });

        it('should handle being passed only a width', function() {
            url.maxSize(320).toString().should.include('?t[]=maxSize%3Awidth%3D320&accessToken=048eb874b111eafd3ed2ed8a858ac6e8a9f9835ce32483f1b3142ab3713a6c1f');
        });

        it('should handle being passed only a height', function() {
            url.maxSize(null, 240).toString().should.include('?t[]=maxSize%3Aheight%3D240&accessToken=ce5f0c5faaab14157b7a1878cba765742e9ef78027bf3b720469e84f0e6fec49');
        });
    });

    describe('#rotate', function() {
        it('should return an unmodified url if angle is not a number', function() {
            var original = url.toString();
            url.rotate('foo').toString().should.equal(original);
        });

        it('should allow a custom background color', function() {
            url.rotate(-45, 'f00baa').toString().should.include('?t[]=rotate%3Aangle%3D-45%2Cbg%3Df00baa&accessToken=023e75f6cc20b2cb444a597591b643458df8dbead3ff15b7ddfcdcc6897b450d');
        });

        it('should default to a black background color', function() {
            url.rotate(30).toString().should.include('?t[]=rotate%3Aangle%3D30%2Cbg%3D000000&accessToken=19c0e3f79a8bd5d128f66188eb80007796f0339c3b787c8d534ff64d09258a61');
        });

        it('should handle angles with decimals', function() {
            url.rotate(13.37).toString().should.include('?t[]=rotate%3Aangle%3D13.37%2Cbg%3D000000&accessToken=91741ba7ae499e9736aea6226056aef77aee346a8beba8fa132c7d220b920eb4');
        });

        it('should strip the hash-symbol from colors', function() {
            url.rotate(51, '#c00c00').toString().should.include('?t[]=rotate%3Aangle%3D51%2Cbg%3Dc00c00&accessToken=f79a9a15d4fac89ec30b5201d2836b73c212fc4fe7e50a73b6087695badf0dbd');
        });
    });

    describe('#sepia', function() {
        it('should return correct transformation', function() {
            url.sepia(90).toString().should.include('?t[]=sepia%3Athreshold%3D90&accessToken=15f821f1ee9f06b5be9b595898aa272eb4cac72244c241e6a4d38fc21fce6e54');
        });

        it('should handle non-integers correctly', function() {
            url.sepia('40').toString().should.include('?t[]=sepia%3Athreshold%3D40&accessToken=07eb6a860f07af4b05ecfaa7ae8c0688e4af7528a435b03863ee336e312f1d3c');
        });

        it('should add default parameters if missing', function() {
            url.sepia().toString().should.include('t[]=sepia%3Athreshold%3D80&accessToken=2dcc06e9dd30e192aa8a43e48bbe563791c210cc841fc13052d9691da9157c68');
        });
    });

    describe('#thumbnail', function() {
        it('should use default arguments if none are given', function() {
            url.thumbnail().toString().should.include('?t[]=thumbnail%3Awidth%3D50%2Cheight%3D50%2Cfit%3Doutbound&accessToken=dacfca5b7f2e309a6fa57330bcf3365ce1d183e54aaf8197a20ef7528766e7b9');
        });

        it('should allow custom arguments', function() {
            url.thumbnail(150, 100, 'inset').toString().should.include('?t[]=thumbnail%3Awidth%3D150%2Cheight%3D100%2Cfit%3Dinset&accessToken=930a15483521b195fb86659ddcaddb00b64e9c2de27c84bc4b93ae5a78f50573');
        });
    });

    describe('#transpose', function() {
        it('should return correct transformation', function() {
            url.transpose().toString().should.include('?t[]=transpose');
        });
    });

    describe('#transverse', function() {
        it('should return correct transformation', function() {
            url.transverse().toString().should.include('?t[]=transverse');
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
            url.append('custom:foo=bar').toString().should.equal('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t[]=custom%3Afoo%3Dbar&accessToken=3ac245d9c6f8b59cedff5a8db5d2791a459fcdb88318591b6330ff42e00a8d3c');
        });
    });

    describe('#getQueryString', function() {
        it('should be empty string when there are no transformations', function() {
            url.getQueryString().should.equal('');
        });

        it('should be able to construct query with existing params', function() {
            var u = new Imbo.Url({
                baseUrl: baseUrl,
                publicKey: pub,
                privateKey: priv,
                imageIdentifier: catMd5,
                queryString: 'foo=bar&moo=tools'
            });

            u.transverse().flipHorizontally().getQueryString().should.equal('foo=bar&moo=tools&t[]=transverse&t[]=flipHorizontally');
        });
    });

    describe('#getUrl', function() {
        it('should contain the base URL', function() {
            url.getUrl().should.include(baseUrl);
        });

        it('should generate the correct URL with no transformations', function() {
            url.getUrl().should.equal('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?accessToken=e67dd2d9e3d46fb458d3bfc238a496127aef57e3156cdd5bd72ee488e4d33465');
        });

        it('should generate the correct URL with transformations', function() {
            url.flipVertically().getUrl().should.equal('http://imbo/users/pub/images/61da9892205a0d5077a353eb3487e8c8?t[]=flipVertically&accessToken=24f11a20edc6c6a1ce0eee9db225b464024492cc58e634bc27042bd833981d60');
        });
    });

    describe('#toString', function() {
        it('should alias getUrl()', function() {
            url.thumbnail();
            url.toString().should.equal(url.getUrl());
        });
    });

});