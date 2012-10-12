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

        it('should add default parameters if missing', function() {
            url.border().toString().should.include('?t[]=border:color=000000,width=1,height=1');
            url.reset();

            url.border('ffffff').toString().should.include('?t[]=border:color=ffffff,width=1,height=1');
            url.reset();

            url.border('f00baa', 5).toString().should.include('?t[]=border:color=f00baa,width=5,height=1');
            url.reset();
        });
    });

});