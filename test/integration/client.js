var assert    = require('assert'),
    fs        = require('fs'),
    Imbo      = require('../../'),
    errServer = require('../servers').createResetServer(),
    stcServer = require('../servers').createStaticServer(),
    fixtures  = __dirname + '/../fixtures',
    catMd5    = '61da9892205a0d5077a353eb3487e8c8';

var stcUrl = 'http://127.0.0.1:6775',
    describeIntegration = (process.env.IMBOCLIENT_RUN_INTEGRATION_TESTS ? describe : describe.skip),
    imboHost    = process.env.IMBOCLIENT_INTEGRATION_HOST    || 'http://127.0.0.1:9012',
    imboPubKey  = process.env.IMBOCLIENT_INTEGRATION_PUBKEY  || 'test',
    imboPrivKey = process.env.IMBOCLIENT_INTEGRATION_PRIVKEY || 'test',
    client,
    errClient;

describeIntegration('ImboClient (integration)', function() {
    before(function() {
        errClient = new Imbo.Client('http://127.0.0.1:6776', 'pub', 'priv');
    });

    beforeEach(function(done) {
        client = new Imbo.Client([imboHost], imboPubKey, imboPrivKey);

        client.deleteImage(catMd5, function() {
            done();
        });
    });

    describe('#addImage', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = fixtures + '/does-not-exist.jpg';
            client.addImage(filename, function(err, imageIdentifier) {
                assert.ok(err, 'addImage should give error if file does not exist');
                assert.equal(err.code, 'ENOENT');
                assert.equal(undefined, imageIdentifier);
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
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier, body, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(catMd5, body.imageIdentifier);
                assert.equal('jpg',  body.extension);
                assert.equal(201, response.statusCode);

                done();
            });
        });

    });

    describe('#addImageFromUrl', function() {
        it('should return an error if the server could not be reached', function(done) {
            errClient.addImageFromUrl(stcUrl + '/cat.jpg', function(err) {
                assert.ok(err, 'addImageFromUrl should give error if host is unreachable');
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            client.addImageFromUrl(stcUrl + '/cat.jpg', function(err, imageIdentifier, body, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal('jpg',  body.extension);
                assert.equal(201, response.statusCode);

                done();
            });
        });
    });

    describe('#addImageFromBuffer', function() {
        it('should return an error if the server could not be reached', function(done) {
            var buffer = fs.readFileSync(fixtures + '/cat.jpg');
            errClient.addImageFromBuffer(buffer, function(err) {
                assert.ok(err, 'addImageFromBuffer should give error if host is unreachable');
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            var buffer = fs.readFileSync(fixtures + '/cat.jpg');
            client.addImageFromBuffer(buffer, function(err, imageIdentifier, body, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal('jpg',  body.extension);
                assert.equal(201, response.statusCode);

                done();
            });
        });
    });

    describe('#getServerStatus()', function() {
        it('should not return an error on a 200-response', function(done) {
            client.getServerStatus(function(err) {
                assert.ifError(err, 'getServerStatus should not give an error on success');
                done();
            });
        });

        it('should convert "date" key to a Date instance', function(done) {
            client.getServerStatus(function(err, info, res) {
                assert.ifError(err, 'getServerStatus should not give an error on success');
                assert.ok(info.date instanceof Date);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should add status code to info object', function(done) {
            client.getServerStatus(function(err, info) {
                assert.ifError(err, 'getServerStatus should not give an error on success');
                assert.equal(200, info.status);
                done();
            });
        });
    });

    describe('#getNumImages', function() {
        it('should return a number on success', function(done) {
            client.getNumImages(function(err, numImages) {
                assert.ifError(err, 'getNumImages() should not give an error on success');
                assert.ok(!isNaN(numImages));
                done();
            });
        });
    });

    describe('#getShortUrl()', function() {
        it('should be able to get a short url for a transformed image', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                var url = client.getImageUrl(imageIdentifier).flipHorizontally();
                client.getShortUrl(url, function(err, shortUrl) {
                    assert.ifError(err, 'getShortUrl should not give an error when getting short url');
                    assert.ok(shortUrl.indexOf(imboHost) === 0, 'short url should contain imbo host');
                    done();
                });
            });
        });
    });

    describe('#getImageData', function() {
        it('should return a buffer on success', function(done) {
            var expectedBuffer = fs.readFileSync(fixtures + '/cat.jpg');

            client.addImageFromBuffer(expectedBuffer, function(err, imageIdentifier) {
                client.getImageData(imageIdentifier, function(err, data) {
                    assert.ifError(err, 'getImageData() should not give an error on success');
                    assert.equal(expectedBuffer.length, data.length);
                    done();
                });
            });
        });

        it('should return an error if the image does not exist', function(done) {
            client.getImageData('f00baa', function(err, data) {
                assert.equal(404, err);
                assert.equal(undefined, data);
                done();
            });
        });
    });

    describe('#getImageChecksumFromBuffer()', function() {
        it('should get the right md5-sum for a buffer', function(done) {
            var buffer = fs.readFileSync(fixtures + '/cat.jpg');

            client.getImageChecksumFromBuffer(buffer, function(err, checksum) {
                assert.ifError(err, 'getImageChecksumFromBuffer() should not give an error on success');
                assert.equal(catMd5, checksum);
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

    describe('#getImageProperties', function() {
        it('should return an object on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.getImageProperties(catMd5, function(err, props) {
                    assert.ifError(err, 'getImageProperties() should not give an error on success');
                    assert.equal(450,          props.width);
                    assert.equal(320,          props.height);
                    assert.equal(23861,        props.filesize);
                    assert.equal('jpg',        props.extension);
                    assert.equal('image/jpeg', props.mimetype);
                    done();
                });
            });
        });

        it('should return an error if the image does not exist', function(done) {
            client.getImageProperties('non-existant', function(err, props) {
                assert.equal(404, err);
                assert.equal(undefined, props);
                done();
            });
        });
    });

    describe('#deleteImage', function() {
        it('should return an http-response on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.deleteImage(catMd5, function(err, res) {
                    assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                    done();
                });
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
                assert.equal(imboPubKey, info.publicKey);
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
            client.addImage(fixtures + '/cat.jpg', function() {
                client.getImages(function(err, images, search, res) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(true, Array.isArray(images));
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should return correct search params', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                var query = new Imbo.Query();
                query.limit(5).checksums([catMd5]);

                client.getImages(query, function(err, images, search, res) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(true, Array.isArray(images));
                    assert.equal(images[0].checksum, catMd5);
                    assert.equal(5, search.limit);
                    assert.equal(1,  search.hits);
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should return no results if unknown id is passed as filter', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                var query = new Imbo.Query();
                query.limit(5).originalChecksums(['something']);

                client.getImages(query, function(err, images, search, res) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(true, Array.isArray(images));
                    assert.equal(5, search.limit);
                    assert.equal(0,  search.hits);
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should only include filtered fields', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                var yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);

                var query = new Imbo.Query();
                query
                    .limit(5)
                    .ids([imageIdentifier])
                    .addFields(['imageIdentifier', 'mime'])
                    .addSort('added', 'desc')
                    .page(1)
                    .from(yesterday)
                    .to(new Date(Date.now() + 10000));

                client.getImages(query, function(err, images, search) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(undefined,       images[0].size);
                    assert.equal(undefined,       images[0].metadata);
                    assert.equal(undefined,       images[0].updated);
                    assert.equal('image/jpeg',    images[0].mime);
                    assert.equal(imageIdentifier, images[0].imageIdentifier);
                    assert.equal(1, search.hits);
                    done();
                });
            });
        });
    });

    describe('#getMetadata', function() {
        it('should return a blank object if no data is present', function(done) {
            client.addImage(fixtures + '/cat.jpg', function() {
                client.deleteMetadata(catMd5, function() {
                    client.getMetadata(catMd5, function(err, meta, res) {
                        assert.ifError(err, 'getMetadata should not give error on success');
                        assert.equal('{}', JSON.stringify(meta));
                        assert.equal(200, res.statusCode);
                        done();
                    });
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
                var metadata = { foo: 'bar', some: 'key' };

                client.editMetadata(catMd5, metadata, function(err, body, res) {
                    assert.ifError(err, 'editMetadata should not give error on success');
                    assert.equal(200, res.statusCode);
                    assert.equal('bar', body.foo);
                    assert.equal('key', body.some);
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
                var metadata = { foo: 'bar', random: Math.floor(Math.random() * 100000) };
                client.replaceMetadata(catMd5, metadata, function(err, body, res) {
                    assert.ifError(err, 'replaceMetadata should not give error on success');
                    assert.equal(metadata.foo, body.foo);
                    assert.equal(metadata.random, body.random);
                    assert.equal(Object.keys(metadata).length, Object.keys(body).length);
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });
    });

});
