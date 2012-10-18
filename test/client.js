var Imbo   = require('../')
  , assert = require('assert')
  , nock   = require('nock')
  , util   = require('util')
  , catMd5 = '61da9892205a0d5077a353eb3487e8c8'
  , undef;

var signatureCleaner = function(path) {
    return path.replace(/timestamp=[^&]*&?/, '')
               .replace(/signature=[^&]*&?/, '')
               .replace(/accessToken=[^&]*&?/, '')
               .replace(/\?$/g, '');
};

describe('Imbo.Client', function() {

    var client    = new Imbo.Client(['http://imbo', 'http://imbo1', 'http://imbo2'], 'pub', 'priv')
      , errClient = new Imbo.Client('http://non-existant-endpoint', 'pub', 'priv')
      , mock      = nock('http://imbo');

    describe('#getImageIdentifier', function() {
        it('should return an error if file does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.getImageIdentifier(filename, function(err, identifier) {
                assert.equal('File does not exist (' + filename + ')', err);
                done();
            });
        });

        it('should generate correct md5sum for a file that exists', function(done) {
            client.getImageIdentifier(__dirname + '/cat.jpg', function(err, identifier) {
                assert.equal(catMd5, identifier);
                assert.equal(undef, err);
                done();
            });
        });
    });

    describe('#getImageUrl', function() {
        it('should return a ImboUrl-instance', function() {
            var url = client.getImageUrl(catMd5);
            assert.equal(true, url instanceof Imbo.Url, 'getImageUrl did not return instance of ImboUrl');
        });

        it('should return something containing the image identifier', function() {
            var url = client.getImageUrl(catMd5).toString();
            assert.equal(true, url.indexOf(catMd5) > 0, 'did not contain ' + catMd5);
        });
    });

    describe('#generateSignature', function() {
        it('should generate a valid signature', function() {
            var sig;
            sig = client.generateSignature('GET', '/images', '2012-10-11T15:10:17Z');
            assert.equal(sig, 'fd16a910040350f12df83b2e077aa2afdcd0f4d262e69eb84d3ad3ee1e5a243c');

            sig = client.generateSignature('PUT', '/images/' + catMd5, '2012-10-03T12:43:37Z');
            assert.equal(sig, '76ae720ada115f6425f2496c8cf38470f90d302fefd6269205efd53695135aac');
        });
    });

    describe('#getSignedResourceUrl', function() {
        it('should generate a valid, signed resource url', function() {
            var url = client.getSignedResourceUrl('PUT', '/images/' + catMd5, new Date(1349268217000));
            assert.equal(url, '/images/' + catMd5 + '?signature=76ae720ada115f6425f2496c8cf38470f90d302fefd6269205efd53695135aac&timestamp=2012-10-03T12%3A43%3A37Z');
        });
    });

    describe('#getHostForImageIdentifier', function() {
        it('should return the same host for the same image identifiers every time', function() {
            for (var i = 0; i < 10; i++) {
                assert.equal('http://imbo1', client.getHostForImageIdentifier('61ca9892205a0d5077a353eb3487e8c8'));
                assert.equal('http://imbo2', client.getHostForImageIdentifier('3b71c51547c3aa1ae81a5e9c57dfef67'));
                assert.equal('http://imbo',  client.getHostForImageIdentifier('3faab4bb128b56bd7d7e977164b3cc7f'));
                assert.equal('http://imbo1', client.getHostForImageIdentifier('61ca9892205a0d5077a353eb3487e8c8'));
            }
        });
    });

    describe('#parseUrls()', function() {
        it('should handle being passed a server-string', function() {
            var urls = client.parseUrls('http://imbo');
            assert.equal(1, urls.length);
            assert.equal('http://imbo', urls[0]);
        });

        it('should handle being passed an array', function() {
            var hosts = ['http://imbo01', 'http://imbo02', 'http://imbo03'];
            var urls = client.parseUrls(hosts), host = hosts.length;
            assert.equal(3, urls.length);

            while (host--) {
                assert.equal(hosts[host], urls[host]);
            }
        });

        it('should strip trailing slashes', function() {
            assert.equal('http://imbo', client.parseUrls('http://imbo/')[0]);
            assert.equal('http://imbo/some/path', client.parseUrls('http://imbo/some/path/')[0]);
        });

        it('should strip port 80', function() {
            assert.equal('http://imbo', client.parseUrls('http://imbo/:80')[0]);
            assert.equal('http://imbo/some/path', client.parseUrls('http://imbo:80/some/path/')[0]);
        });
    });

    describe('#headImage()', function() {
        it('should return error on a 404-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(404);

            client.headImage(catMd5, function(err, res) {
                assert.equal(404, err);
                done();
            });
        });

        it('should return error on a 503-response', function(done) {
            mock.head('/users/pub/images/' + catMd5)
                .reply(503);

            client.headImage(catMd5, function(err, res) {
                assert.equal(503, err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            mock.head('/users/pub/images/' + catMd5)
                .reply(200);

            client.headImage(catMd5, function(err, res) {
                assert.equal(undef, err);
                done();
            });
        });

        it('should return an http-response on success', function(done) {
            mock.head('/users/pub/images/' + catMd5)
                .reply(200, 'OK', { 'X-Imbo-Imageidentifier': catMd5 });

            client.headImage(catMd5, function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                done();
            });
        });

        it('should return error when host could not be reached', function(done) {
            errClient.headImage(catMd5, function(err, res) {
                assert.equal('ENOTFOUND', err.code);
                done();
            });
        });
    });

    describe('#deleteImage()', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.imageExists(filename, function(err, exists) {
                assert.equal('File does not exist (' + filename + ')', err);
                assert.equal(undef, exists);
                done();
            });
        });
    });

    describe('#deleteImageByIdentifier', function() {
        it('should return an http-response on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/' + catMd5, 'DELETE')
                .reply(200, 'OK', { 'X-Imbo-Imageidentifier': catMd5 });

            client.deleteImageByIdentifier(catMd5, function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                done();
            });
        });
    });

    describe('#imageIdentifierExists', function() {
        it('should return true if the identifier exists', function(done) {
            mock.head('/users/pub/images/' + catMd5)
                .reply(200, 'OK');

            client.imageIdentifierExists(catMd5, function(err, exists) {
                assert.equal(err, undef);
                assert.equal(true, exists);
                done();
            });
        });

        it('should return false if the identifier does not exist', function(done) {
            mock.head('/users/pub/images/' + catMd5)
                .reply(404, 'Image not found');

            client.imageIdentifierExists(catMd5, function(err, exists) {
                assert.equal(err, undef);
                assert.equal(false, exists);
                done();
            });
        });

        it('should return an error if the server could not be reached', function(done) {
            errClient.imageIdentifierExists(catMd5, function(err, exists) {
                assert.equal('ENOTFOUND', err.code);
                done();
            });
        });
    });

    describe('#imageExists', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.imageExists(filename, function(err, exists) {
                assert.equal('File does not exist (' + filename + ')', err);
                assert.equal(undef, exists);
                done();
            });
        });

        it('should return true if the image exists on disk and on server', function(done) {
            mock.head('/users/pub/images/' + catMd5)
                .reply(200, 'OK');

            client.imageExists(__dirname + '/cat.jpg', function(err, exists) {
                assert.equal(err, undef);
                assert.equal(true, exists);
                done();
            });
        });
    });

    describe('#addImage', function() {
        it('should return error if the local image does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.addImage(filename, function(err, response) {
                assert.equal('File does not exist (' + filename + ')', err);
                assert.equal(undef, response);
                done();
            });
        });

        it('should return an error if the image could not be added', function(done) {
            mock.filteringRequestBody(function(data) {
                    return '*';
                })
                .put('/users/pub/images/' + catMd5, '*')
                .reply(400, 'Image already exists', { 'X-Imbo-Imageidentifier': catMd5 });

            client.addImage(__dirname + '/cat.jpg', function(err, imageIdentifier, response) {
                assert.equal(400, err);
                assert.equal(null, imageIdentifier);
                done();
            });
        });

        it('should return an error if the server could not be reached', function(done) {
            errClient.addImage(__dirname + '/cat.jpg', function(err, imageIdentifier, res) {
                assert.equal('ENOTFOUND', err.code);
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            mock.filteringRequestBody(function(data) {
                    return '*';
                })
                .put('/users/pub/images/' + catMd5, '*')
                .reply(201, 'Created', { 'X-Imbo-Imageidentifier': catMd5 });

            client.addImage(__dirname + '/cat.jpg', function(err, imageIdentifier, response) {
                assert.equal(undef, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(201, response.statusCode);

                mock = nock('http://imbo');
                done();
            });
        });
    });

    describe('#getMetadata', function() {
        it('should return an object of key => value data', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images/' + catMd5 + '/meta')
                .reply(200, JSON.stringify({ 'foo': 'bar' }));

            client.getMetadata(catMd5, function(err, meta, res) {
                assert.equal(undef, err);
                assert.equal('bar', meta.foo);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images/non-existant/meta')
                .reply(404, 'Image not found');

            client.getMetadata('non-existant', function(err, body, res) {
                assert.equal(404, err);
                assert.equal(null, body);
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    describe('#deleteMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/non-existant/meta', 'DELETE')
                .reply(404, 'Image not found');

            client.deleteMetadata('non-existant', function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/' + catMd5 + '/meta', 'DELETE')
                .reply(200, 'OK');

            client.deleteMetadata(catMd5, function(err) {
                assert.equal(undef, err);
                done();
            });
        });
    });

    describe('#editMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .post('/users/pub/images/non-existant/meta', { foo: 'bar' })
                .reply(404, 'Image not found');

            client.editMetadata('non-existant', { foo: 'bar' }, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .post('/users/pub/images/' + catMd5 + '/meta', { foo: 'bar' })
                .reply(200, 'OK');

            client.editMetadata(catMd5, { foo: 'bar' }, function(err, res) {
                assert.equal(undef, err);
                assert.equal(200, res.statusCode);
                done();
            });
        });
    });

    after(function() {
        mock.done();
    });

});
