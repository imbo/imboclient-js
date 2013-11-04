var assert    = require('assert')
  , Imbo      = require('../../')
  , errServer = require('../servers').createResetServer()
  , stcServer = require('../servers').createStaticServer()
  , fixtures  = __dirname + '/../fixtures'
  , catMd5    = '61da9892205a0d5077a353eb3487e8c8';

var stcUrl = 'http://127.0.0.1:6775'
  , describeIntegration = (process.env.IMBOCLIENT_RUN_INTEGRATION_TESTS ? describe : describe.skip)
  , imboHost    = process.env.IMBOCLIENT_INTEGRATION_HOST    || 'http://127.0.0.1:9012'
  , imboPubKey  = process.env.ImboClient_INTEGRATION_PUBKEY  || 'test'
  , imboPrivKey = process.env.ImboClient_INTEGRATION_PRIVKEY || 'test'
  , client
  , errClient;

describeIntegration('ImboClient (integration)', function() {
    before(function() {
        errClient = new Imbo.Client('http://127.0.0.1:6776', 'pub', 'priv');
        console.log('Using host: ' + imboHost + ' (' + imboPubKey + ' / ' + imboPrivKey + ')');
    });

    beforeEach(function(done) {
        client = new Imbo.Client([imboHost], imboPubKey, imboPrivKey);

        client.deleteImageByIdentifier(catMd5, function() {
            done();
        });
    });

    describe('#addImage', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = fixtures + '/does-not-exist.jpg';
            client.addImage(filename, function(err, response) {
                assert.ok(err, 'addImage should give error if file does not exist');
                assert.equal(err.code, 'ENOENT');
                assert.equal(undefined, response);
                done();
            });
        });

        it('should return an error if the image could not be added', function(done) {
            client.addImage(fixtures + '/invalid.png', function(err, imageIdentifier) {
                assert.equal(415, err);
                assert.equal(null, imageIdentifier);
                done();
            });
        });

        it('should return an error if the server could not be reached', function(done) {
            errClient.addImage(fixtures + '/cat.jpg', function(err) {
                assert.ok(err, 'addImage should give error if host is unreachable');
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(201, response.statusCode);

                done();
            });
        });

    });

    describe('#addImageFromUrl', function() {
        it('should return error if the remote image does not exist', function(done) {
            var url = stcUrl + '/some-404-image.jpg';
            client.addImageFromUrl(url, function(err, response) {
                assert.ok(err, 'addImage should give error if file does not exist');
                assert.equal(404, err);
                assert.equal(undefined, response);
                done();
            });
        });

        it('should return an error if the server could not be reached', function(done) {
            errClient.addImage(fixtures + '/cat.jpg', function(err) {
                assert.ok(err, 'addImage should give error if host is unreachable');
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(201, response.statusCode);

                done();
            });
        });

    });

    describe('#headImage()', function() {
        it('should return error on a 404-response', function(done) {
            client.headImage(catMd5, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.headImage(catMd5, function(err) {
                    assert.ifError(err, 'headImage should not give an error on success');
                    done();
                });
            });
        });

        it('should return an http-response on success', function(done) {
            client.headImage(catMd5, function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                done();
            });
        });

        it('should return error when host could not be reached', function(done) {
            this.timeout(10000);
            errClient.headImage(catMd5, function(err) {
                assert.ok(err, 'headImage should give error if host is unreachable');
                done();
            });
        });

    });

    describe('#deleteImage()', function() {
        it('should return an http-response on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.deleteImage(fixtures + '/cat.jpg', function(err, res) {
                    assert.ifError(err, 'Successful delete should not give an error');
                    assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                    done();
                });
            });
        });

        it('should return error if the local image does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.deleteImage(filename, function(err, exists) {
                assert.equal('File does not exist (' + filename + ')', err);
                assert.equal(undefined, exists);
                done();
            });
        });
    });

    describe('#deleteImageByIdentifier', function() {
        it('should return an http-response on success', function(done) {
            client.deleteImageByIdentifier(catMd5, function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                done();
            });
        });
    });

    describe('#imageIdentifierExists', function() {
        it('should return false if the identifier does not exist', function(done) {
            client.imageIdentifierExists(catMd5, function(err, exists) {
                assert.ifError(err, 'imageIdentifierExists should not fail when image does not exist on server');
                assert.equal(false, exists);
                done();
            });
        });

        it('should return true if the identifier exists', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.imageIdentifierExists(catMd5, function(err, exists) {
                    assert.ifError(err, 'Image that exists should not give an error');
                    assert.equal(true, exists);
                    done();
                });
            });
        });

        it('should return an error if the server could not be reached', function(done) {
            errClient.imageIdentifierExists(catMd5, function(err) {
                assert.ok(err, 'imageIdentifierExists should give error if host is unreachable');
                done();
            });
        });
    });

    describe('#imageExists', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = fixtures + '/non-existant.jpg';
            client.imageExists(filename, function(err, exists) {
                assert.equal('File does not exist (' + filename + ')', err);
                assert.equal(undefined, exists);
                done();
            });
        });

        it('should return true if the image exists on disk and on server', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.imageExists(fixtures + '/cat.jpg', function(err, exists) {
                    assert.ifError(err, 'imageExists should not give error if image exists on disk and server');
                    assert.equal(true, exists);
                    done();
                });
            });
        });

        it('should return false if the image exists on disk but not on server', function(done) {
            client.imageExists(fixtures + '/cat.jpg', function(err, exists) {
                assert.ifError(err, 'imageExists should not give error if the image does not exist on server');
                assert.equal(false, exists);
                done();
            });
        });
    });

    describe('#getUserInfo', function() {
        it('should return an object of key => value data', function(done) {
            client.getUserInfo(function(err, info, res) {
                assert.ifError(err, 'getUserInfo should not give an error on success');
                assert.equal('test', info.publicKey);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return an error if the user does not exist', function(done) {
            client = new Imbo.Client([imboHost], 'AngLAmgALNFAGLKdmgdAGmkl', 'test');
            client.getUserInfo(function(err, body, res) {
                assert.equal(404, err);
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    describe('#getImages', function() {
        it('should return an array of image objects', function(done) {
            client.getImages(null, function(err, images, res) {
                assert.ifError(err, 'getImages should not give an error on success');
                assert.equal(true, Array.isArray(images));
                assert.equal(200, res.statusCode);
                done();
            });
        });
    });

    describe('#getMetadata', function() {
        it('should return a blank object if no data is present', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.getMetadata(catMd5, function(err, meta, res) {
                    assert.ifError(err, 'getMetadata should not give error on success');
                    assert.equal('{}', JSON.stringify(meta));
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should return a key => value object if data is present', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.editMetadata(catMd5, { foo: 'bar' }, function() {
                    client.getMetadata(catMd5, function(err, meta, res) {
                        assert.ifError(err, 'getMetadata should not give error on success');
                        assert.equal('bar', meta.foo);
                        assert.equal(200, res.statusCode);
                        done();
                    });
                });
            });
        });

        it('should return an error if the identifier does not exist', function(done) {
            client.getMetadata('non-existant', function(err, body, res) {
                assert.equal(404, err);
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    describe('#deleteMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            client.deleteMetadata('non-existant', function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.deleteMetadata(catMd5, function(err) {
                    assert.ifError(err, 'deleteMetadata should not give error on success');
                    done();
                });
            });
        });
    });

    describe('#editMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            client.editMetadata('non-existant', { foo: 'bar' }, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.editMetadata(catMd5, { foo: 'bar' }, function(err, res) {
                    assert.ifError(err, 'editMetadata should not give error on success');
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });
    });

    describe('#replaceMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            client.replaceMetadata('non-existant', { foo: 'bar' }, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.replaceMetadata(catMd5, { foo: 'bar' }, function(err, res) {
                    assert.ifError(err, 'replaceMetadata should not give error on success');
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });
    });

});
