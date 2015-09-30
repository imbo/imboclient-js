/* eslint max-nested-callbacks: 0 */
'use strict';

var assert = require('assert'),
    fs = require('fs'),
    Imbo = require('../../'),
    path = require('path'),
    request = require('request');

var fixtures = path.join(__dirname, '..', 'fixtures'),
    imageId = /^[a-f0-9-]{32,36}$/,
    catMd5 = '61da9892205a0d5077a353eb3487e8c8';

var stcUrl = 'http://127.0.0.1:6775',
    describeIntegration = (process.env.IMBOCLIENT_RUN_INTEGRATION_TESTS ? describe : describe.skip),
    imboHost = process.env.IMBOCLIENT_INTEGRATION_HOST || 'http://127.0.0.1:9012',
    imboUser = process.env.IMBOCLIENT_INTEGRATION_USER || 'test',
    imboPubKey = process.env.IMBOCLIENT_INTEGRATION_PUBKEY || 'test',
    imboPrivKey = process.env.IMBOCLIENT_INTEGRATION_PRIVKEY || 'test',
    imageIdentifiers,
    stcServer,
    errServer,
    client,
    errClient;

describeIntegration('ImboClient (integration)', function() {
    this.timeout(5000);

    before(function(done) {
        errClient = new Imbo.Client('http://127.0.0.1:6776', 'pub', 'priv');
        errServer = require('../servers').createResetServer();
        stcServer = require('../servers').createStaticServer();

        var options = {
            hosts: [imboHost],
            user: imboUser,
            publicKey: imboPubKey,
            privateKey: imboPrivKey
        };

        client = new Imbo.Client(options);
        client.getUserInfo(function(err, info) {
            if (err) {
                console.error('\nDouble check host, user and public/private keys:');
                console.error(options);
                throw err;
            }

            done();
        });
    });

    beforeEach(function() {
        imageIdentifiers = [];
    });

    afterEach(function(done) {
        var remaining = imageIdentifiers.length;
        if (remaining === 0) {
            return setImmediate(done);
        }

        imageIdentifiers.forEach(function(identifier) {
            client.deleteImage(identifier, function() {
                if (--remaining === 0) {
                    done();
                }
            });
        });
    });

    after(function(done) {
        stcServer.close(function() {
            errServer.close(done);
        });
    });

    describe('#addImage', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = fixtures + '/does-not-exist.jpg';
            client.addImage(filename, function(err) {
                assert.ok(err, 'addImage should give error if file does not exist');
                assert.equal(err.code, 'ENOENT');
                done();
            });
        });

        it('should return an error if the image could not be added', function(done) {
            client.addImage(fixtures + '/invalid.png', function(err) {
                assert(err);
                assert(err.message.match(/\b415\b/));
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
                assert.ifError(err);
                assert(imageId.test(imageIdentifier));
                assert.equal(body.imageIdentifier, imageIdentifier);
                assert.equal(body.extension, 'jpg');
                assert.equal(response.statusCode, 201);

                imageIdentifiers.push(imageIdentifier);
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
                assert.ifError(err);
                assert(imageId.test(imageIdentifier));
                assert.equal('jpg', body.extension);
                assert.equal(201, response.statusCode);

                imageIdentifiers.push(imageIdentifier);
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
                assert.ifError(err);
                assert(imageId.test(imageIdentifier));
                assert.equal('jpg', body.extension);
                assert.equal(201, response.statusCode);

                imageIdentifiers.push(imageIdentifier);
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

    describe('#parseImageUrl()', function() {
        it('should be able to parse and modify existing url', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                assert.ifError(err);
                var url = client.getImageUrl(imageIdentifier).flipHorizontally();

                var modUrl = client.parseImageUrl(url.toString()).sepia().png();
                request.head(modUrl.toString(), function(headErr, res) {
                    assert.ifError(headErr);
                    assert.equal(200, res.statusCode);
                    assert.equal('image/png', res.headers['content-type']);
                    done();
                });

                imageIdentifiers.push(imageIdentifier);
            });
        });
    });

    describe('#getShortUrl()', function() {
        it('should be able to get a short url for a transformed image', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                assert.ifError(err);
                var url = client.getImageUrl(imageIdentifier).flipHorizontally();
                client.getShortUrl(url, function(shortUrlErr, shortUrl) {
                    assert.ifError(shortUrlErr);
                    assert.ifError(err, 'getShortUrl should not give an error when getting short url');
                    assert.ok(shortUrl.toString().indexOf(imboHost) === 0, 'short url should contain imbo host');
                    assert.ok(shortUrl.toString().match(/\/s\/[a-zA-Z0-9]{7}$/));
                    done();
                });

                imageIdentifiers.push(imageIdentifier);
            });
        });

        it('should be able to get a short url that works', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                assert.ifError(err);
                var url = client.getImageUrl(imageIdentifier).sepia().png();
                client.getShortUrl(url, function(shortUrlErr, shortUrl) {
                    assert.ifError(shortUrlErr);
                    request.head(shortUrl.toString(), function(headErr, res) {
                        assert.ifError(headErr);
                        assert.equal(200, res.statusCode);
                        assert.equal('image/png', res.headers['content-type']);
                        done();
                    });
                });

                imageIdentifiers.push(imageIdentifier);
            });
        });
    });

    describe('#deleteAllShortUrlsForImage()', function() {
        it('should return error on backend failure', function(done) {
            errClient.deleteAllShortUrlsForImage(catMd5, function(err) {
                assert.ok(err, 'deleteAllShortUrlsForImage should give error if host is unreachable');
                done();
            });
        });

        it('should delete all short URLs currently present', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                assert.ifError(err);
                imageIdentifiers.push(imageIdentifier);

                var url = client.getImageUrl(imageIdentifier).sepia().png();
                client.getShortUrl(url, function(shortUrlErr, shortUrl) {
                    assert.ifError(shortUrlErr);
                    request.head(shortUrl.toString(), function(headErr, res) {
                        assert.ifError(headErr, 'HEAD-request against shortUrl should not give an error');
                        assert.equal(200, res.statusCode, 'After generating the ShortUrl, it should exist');
                        assert.equal('image/png', res.headers['content-type']);

                        client.deleteAllShortUrlsForImage(imageIdentifier, function(deleteErr) {
                            assert.ifError(deleteErr, 'deleteAllShortUrlsForImage() should not give an error on success');

                            request.head(shortUrl.toString(), function(headErr2, secondRes) {
                                var msg = 'After deleting all ShortUrls, it should no longer exist';
                                msg += '(expected 404, got ' + secondRes.statusCode + ') - ';
                                msg += 'HEAD ' + shortUrl.toString();

                                assert.equal(404, secondRes.statusCode, msg);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#deleteShortUrlForImage', function() {
        it('should delete the provided ShortUrl', function(done) {
            // Add the image
            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                assert.ifError(err);

                imageIdentifiers.push(imageIdentifier);
                var url = client.getImageUrl(imageIdentifier).desaturate().jpg();

                // Generate a short-url
                client.getShortUrl(url, function(shortUrlErr, shortUrl) {
                    assert.ifError(shortUrlErr);
                    // Verify that the short-url works
                    request.head(shortUrl.toString(), function(headErr, res) {
                        assert.ifError(headErr);
                        assert.equal(200, res.statusCode, 'After generating the ShortUrl, it should exist');
                        assert.equal('image/jpeg', res.headers['content-type']);

                        // Delete the short-url
                        client.deleteShortUrlForImage(imageIdentifier, shortUrl.getId(), function(deleteErr) {
                            assert.ifError(deleteErr, 'deleteShortUrlForImage() should not give an error on success');

                            // Verify that the short-url has been deleted
                            request.head(shortUrl.toString(), function(headErr2, secondRes) {
                                var msg = 'After deleting the ShortUrl, it should no longer exist';
                                msg += '(expected 404, got ' + secondRes.statusCode + ') - ';
                                msg += 'HEAD ' + shortUrl.toString();

                                assert.equal(404, secondRes.statusCode, msg);
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    describe('#getImageData', function() {
        it('should return a buffer on success', function(done) {
            var expectedBuffer = fs.readFileSync(fixtures + '/cat.jpg');

            client.addImageFromBuffer(expectedBuffer, function(err, imageIdentifier) {
                assert.ifError(err);

                imageIdentifiers.push(imageIdentifier);
                client.getImageData(imageIdentifier, function(imgDataErr, data) {
                    assert.ifError(imgDataErr, 'getImageData() should not give an error on success');
                    assert.equal(expectedBuffer.length, data.length);
                    done();
                });
            });
        });

        it('should return an error if the image does not exist', function(done) {
            client.getImageData('f00baa', function(err) {
                assert(err);
                assert(err.message.match(/\b404\b/));
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
            client.headImage('foobar', function(err) {
                assert(err);
                assert(err.message.match(/\b404\b/));
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);
                client.headImage(imageIdentifier, function(err) {
                    assert.ifError(err, 'headImage should not give an error on success');
                    done();
                });
            });
        });

        it('should return an http-response on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);
                client.headImage(imageIdentifier, function(err, res) {
                    assert.ifError(err);
                    assert.equal(res.headers['x-imbo-imageidentifier'], imageIdentifier);

                    done();
                });
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
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);
                client.getImageProperties(imageIdentifier, function(err, props) {
                    assert.ifError(err, 'getImageProperties() should not give an error on success');
                    assert.equal(450, props.width);
                    assert.equal(320, props.height);
                    assert.equal(23861, props.filesize);
                    assert.equal('jpg', props.extension);
                    assert.equal('image/jpeg', props.mimetype);
                    done();
                });
            });
        });

        it('should return an error if the image does not exist', function(done) {
            client.getImageProperties('non-existant', function(err) {
                assert(err);
                assert(err.message.match(/\b404\b/));
                done();
            });
        });
    });

    describe('#deleteImage', function() {
        it('should return an http-response on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);
                client.deleteImage(imageIdentifier, function(err, res) {
                    assert.ifError(err);
                    assert.equal(res.headers['x-imbo-imageidentifier'], imageIdentifier);
                    done();
                });
            });
        });
    });

    describe('#imageIdentifierExists', function() {
        it('should return false if the identifier does not exist', function(done) {
            client.imageIdentifierExists('foobar', function(err, exists) {
                assert.ifError(err, 'imageIdentifierExists should not fail when image does not exist on server');
                assert.equal(false, exists);
                done();
            });
        });

        it('should return true if the identifier exists', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);
                client.imageIdentifierExists(imageIdentifier, function(err, exists) {
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
            client.imageExists(filename, function(err) {
                assert.equal('File does not exist (' + filename + ')', err);
                done();
            });
        });

        it('should return true if the image exists on disk and on server', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);
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
                assert.equal(imboUser, info.user);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return an error if the user does not exist', function(done) {
            var someClient = new Imbo.Client([imboHost], 'AngLAmgALNFAGLKdmgdAGmkl', 'test');
            someClient.getUserInfo(function(err, body, res) {
                assert(err);
                assert(err.message.match(/\b404\b/));
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    describe('#getImages', function() {
        it('should return an array of image objects', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                client.getImages(function(err, images, search, res) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(true, Array.isArray(images));
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should return correct search params', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                var query = new Imbo.Query();
                query.limit(5).checksums([catMd5]);

                client.getImages(query, function(err, images, search, res) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(true, Array.isArray(images));
                    assert.equal(images[0].checksum, catMd5);
                    assert.equal(5, search.limit);
                    assert.equal(1, search.hits);
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should return no results if unknown id is passed as filter', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                var query = new Imbo.Query();
                query.limit(5).originalChecksums(['something']);

                client.getImages(query, function(err, images, search, res) {
                    assert.ifError(err, 'getImages should not give an error on success');
                    assert.equal(true, Array.isArray(images));
                    assert.equal(5, search.limit);
                    assert.equal(0, search.hits);
                    assert.equal(200, res.statusCode);
                    done();
                });
            });
        });

        it('should only include filtered fields', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

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
                    assert.equal('undefined', typeof images[0].size);
                    assert.equal('undefined', typeof images[0].metadata);
                    assert.equal('undefined', typeof images[0].updated);
                    assert.equal('image/jpeg', images[0].mime);
                    assert.equal(imageIdentifier, images[0].imageIdentifier);
                    assert.equal(1, search.hits);
                    done();
                });
            });
        });
    });

    describe('#getMetadata', function() {
        it('should return a blank object if no data is present', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                client.deleteMetadata(imageIdentifier, function() {
                    client.getMetadata(imageIdentifier, function(err, meta, res) {
                        assert.ifError(err, 'getMetadata should not give error on success');
                        assert.equal('{}', JSON.stringify(meta));
                        assert.equal(200, res.statusCode);
                        done();
                    });
                });
            });
        });

        it('should return a key => value object if data is present', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                client.editMetadata(imageIdentifier, { foo: 'bar' }, function() {
                    client.getMetadata(imageIdentifier, function(err, meta, res) {
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
                assert(err);
                assert(err.message.match(/\b404\b/));
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    describe('#deleteMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            client.deleteMetadata('non-existant', function(err) {
                assert(err);
                assert(err.message.match(/\b404\b/));
                done();
            });
        });

        it('should not return any error on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                client.deleteMetadata(imageIdentifier, function(err) {
                    assert.ifError(err, 'deleteMetadata should not give error on success');
                    done();
                });
            });
        });
    });

    describe('#editMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            client.editMetadata('non-existant', { foo: 'bar' }, function(err) {
                assert(err);
                assert(err.message.match(/\b404\b/));
                done();
            });
        });

        it('should not return any error on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                var metadata = { foo: 'bar', some: 'key' };
                client.editMetadata(imageIdentifier, metadata, function(err, body, res) {
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
                assert(err);
                assert(err.message.match(/\b404\b/));
                done();
            });
        });

        it('should not return any error on success', function(done) {
            client.addImage(fixtures + '/cat.jpg', function(addErr, imageIdentifier) {
                imageIdentifiers.push(imageIdentifier);

                var metadata = { foo: 'bar', random: Math.floor(Math.random() * 100000) };
                client.replaceMetadata(imageIdentifier, metadata, function(err, body, res) {
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
