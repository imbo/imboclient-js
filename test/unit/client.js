var assert    = require('assert'),
    nock      = require('nock'),
    should    = require('should'),
    fs        = require('fs'),
    Imbo      = require('../../'),
    errServer = require('../servers').createResetServer(),
    stcServer = require('../servers').createStaticServer(),
    fixtures  = __dirname + '/../fixtures',
    catMd5    = '61da9892205a0d5077a353eb3487e8c8';

var signatureCleaner = function(path) {
    return path.replace(/timestamp=[^&]*&?/, '')
               .replace(/signature=[^&]*&?/, '')
               .replace(/accessToken=[^&]*&?/, '')
               .replace(/[?&]$/g, '');
};

var bodyCleaner = function() {
    return '*';
};

var client, errClient, mock, mockImgUrl, stcUrl = 'http://localhost:6775';

describe('ImboClient', function() {
    before(function() {
        client = new Imbo.Client(['http://imbo', 'http://imbo1', 'http://imbo2'], 'pub', 'priv');
        errClient = new Imbo.Client('http://localhost:6776', 'pub', 'priv');
    });

    beforeEach(function() {
        mock = nock('http://imbo');
        mockImgUrl = nock('http://imbo1');
    });

    afterEach(function() {
        mock.done();
        mockImgUrl.done();
    });


    describe('#getServerStatus()', function() {
        it('should return error on a 503-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/status')
                .reply(503);

            client.getServerStatus(function(err) {
                assert.equal(503, err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/status')
                .reply(200);

            client.getServerStatus(function(err) {
                assert.ifError(err, 'getServerStatus should not give an error on success');
                done();
            });
        });

        it('should convert "date" key to a Date instance', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/status')
                .reply(200, JSON.stringify({
                    'date': 'Fri, 14 Mar 2014 07:43:49 GMT'
                }), { 'Content-Type': 'application/json' });

            client.getServerStatus(function(err, info, res) {
                assert.ifError(err, 'getServerStatus should not give an error on success');
                assert.ok(info.date instanceof Date);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should add status code to info object', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/status')
                .reply(200, JSON.stringify({
                    'date': 'Fri, 14 Mar 2014 07:43:49 GMT'
                }), { 'Content-Type': 'application/json' });

            client.getServerStatus(function(err, info) {
                assert.ifError(err, 'getServerStatus should not give an error on success');
                assert.equal(200, info.status);
                done();
            });
        });

    });

    describe('#getServerStats()', function() {
        it('should return error on a 503-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/stats')
                .reply(503);

            client.getServerStats(function(err) {
                assert.equal(503, err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/stats')
                .reply(200);

            client.getServerStats(function(err) {
                assert.ifError(err, 'getServerStats should not give an error on success');
                done();
            });
        });

        it('should give back a meaningful info object', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/stats')
                .reply(200, JSON.stringify({
                    'foo': 'bar',
                    'number': 1337
                }), { 'Content-Type': 'application/json' });

            client.getServerStats(function(err, info) {
                assert.ifError(err, 'getServerStats should not give an error on success');
                assert.equal(1337, info.number);
                assert.equal('bar', info.foo);
                done();
            });
        });

    });

    describe('#getImageChecksum', function() {
        it('should return an error if file does not exist', function(done) {
            var filename = __dirname + '/does-not-exist.jpg';
            client.getImageChecksum(filename, function(err) {
                assert.equal('File does not exist (' + filename + ')', err);
                done();
            });
        });

        it('should generate correct md5sum for a file that exists', function(done) {
            client.getImageChecksum(fixtures + '/cat.jpg', function(err, identifier) {
                assert.ifError(err, 'getImageChecksum should not give an error on success');
                assert.equal(catMd5, identifier);
                done();
            });
        });
    });

    describe('#getImageChecksumFromBuffer', function() {
        it('should generate correct md5sum for a normal text string', function(done) {
            client.getImageChecksumFromBuffer('pliney-the-elder', function(err, identifier) {
                assert.ifError(err, 'getImageChecksumFromBuffer should not give an error on success');
                assert.equal('f755bd139f9026604d4bdd31bf6ee50e', identifier);
                done();
            });
        });

        it('should generate correct md5sum for a buffer', function(done) {
            var content = fs.readFileSync(fixtures + '/cat.jpg');
            client.getImageChecksumFromBuffer(content, function(err, identifier) {
                assert.ifError(err, 'getImageChecksumFromBuffer should not give an error on success');
                assert.equal(catMd5, identifier);
                done();
            });
        });
    });

    describe('#getImageUrl', function() {
        it('should return a ImboUrl-instance', function() {
            var url = client.getImageUrl(catMd5);
            assert.equal(true, url instanceof Imbo.ImageUrl, 'getImageUrl did not return instance of ImboUrl');
        });

        it('should return something containing the image identifier', function() {
            var url = client.getImageUrl(catMd5).toString();
            assert.equal(true, url.indexOf(catMd5) > 0, url + ' did not contain ' + catMd5);
        });
    });

    describe('#getImagesUrl', function() {
        it('should return a ImboUrl-instance', function() {
            var url = client.getImagesUrl();
            assert.equal(true, url instanceof Imbo.Url, 'getImagesUrl did not return instance of ImboUrl');
        });

        it('should return the expected URL-string', function() {
            var url = client.getImagesUrl().toString();
            assert.equal('http://imbo/users/pub/images', signatureCleaner(url));
        });
    });

    describe('#getUserUrl', function() {
        it('should return a ImboUrl-instance', function() {
            var url = client.getUserUrl();
            assert.equal(true, url instanceof Imbo.Url, 'getUserUrl did not return instance of ImboUrl');
        });

        it('should return the expected URL-string', function() {
            var url = client.getUserUrl().toString();
            assert.equal('http://imbo/users/pub', signatureCleaner(url));
        });
    });

    describe('#getStatusUrl', function() {
        it('should return a URL with the first defined host as hostname', function() {
            var url = client.getStatusUrl().toString();
            assert.equal('http://imbo/status', signatureCleaner(url));
        });
    });

    describe('#getStatsUrl', function() {
        it('should return a URL with the first defined host as hostname', function() {
            var url = client.getStatsUrl().toString();
            assert.equal('http://imbo/stats', signatureCleaner(url));
        });
    });

    describe('#getMetadataUrl', function() {
        it('should return a URL with the first defined host as hostname', function() {
            var url = client.getMetadataUrl(catMd5).toString()
            assert.equal(
                'http://imbo/users/pub/images/' + catMd5 + '/meta',
                signatureCleaner(url)
            );
        });
    });

    describe('#getResourceUrl', function() {
        it('should return a ImboUrl-instance', function() {
            var url = client.getResourceUrl({
                path: '/some/path',
                queryString: 'page=2&limit=3'
            });

            assert.equal(true, url instanceof Imbo.Url, 'getResourceUrl did not return instance of ImboUrl');
        });

        it('should return the expected URL-string', function() {
            var url = client.getResourceUrl({
                path: '/some/path',
                query: 'page=2&limit=3'
            }).toString();

            url.should.include('http://imbo/some/path?page=2&limit=3&accessToken');
        });
    });

    describe('#getShortUrl()', function() {
        it('should return error on a 503-response', function(done) {
            var imgUrl = client.getImageUrl(catMd5);

            mockImgUrl.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(503);

            client.getShortUrl(imgUrl, function(err) {
                assert.equal(503, err);
                done();
            });
        });

        it('should return error if no shorturl header was found', function(done) {
            var imgUrl = client.getImageUrl(catMd5);

            mockImgUrl.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(200, 'OK');

            client.getShortUrl(imgUrl, function(err) {
                assert.ok(err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            var imgUrl   = client.getImageUrl(catMd5),
                shortUrl = 'http://imbo/s/axamoo';

            mockImgUrl.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(200, 'OK', { 'X-Imbo-ShortUrl': shortUrl });

            client.getShortUrl(imgUrl, function(err, returnedShortUrl) {
                assert.ifError(err, 'getShortUrl should not give an error on success');
                assert.equal(shortUrl, returnedShortUrl);
                done();
            });
        });

    });

    describe('#generateSignature', function() {
        it('should generate a valid signature', function() {
            var sig;
            sig = client.generateSignature('GET', '/images', '2012-10-11T15:10:17Z');
            assert.equal(sig, 'fd16a910040350f12df83b2e077aa2afdcd0f4d262e69eb84d3ad3ee1e5a243c');

            sig = client.generateSignature('PUT', '/images/' + catMd5 + '/meta', '2012-10-03T12:43:37Z');
            assert.equal(sig, 'afd4c4de76a95d5ed5c23a908278cab40817012a5a5c750d971177d3cba97bf5');
        });
    });

    describe('#getSignedResourceUrl', function() {
        it('should generate a valid, signed resource url', function() {
            var url = client.getSignedResourceUrl('PUT', '/images/' + catMd5 + '/meta', new Date(1349268217000));
            assert.equal(url, '/images/' + catMd5 + '/meta?signature=afd4c4de76a95d5ed5c23a908278cab40817012a5a5c750d971177d3cba97bf5&timestamp=2012-10-03T12%3A43%3A37Z');
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

            client.headImage(catMd5, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should return error on a 503-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(503);

            client.headImage(catMd5, function(err) {
                assert.equal(503, err);
                done();
            });
        });

        it('should not return an error on a 200-response', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(200);

            client.headImage(catMd5, function(err) {
                assert.ifError(err, 'headImage should not give an error on success');
                done();
            });
        });

        it('should return an http-response on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(200, 'OK', { 'X-Imbo-Imageidentifier': catMd5 });

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

    describe('#deleteImage', function() {
        it('should return an http-response on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/' + catMd5, 'DELETE')
                .reply(200, 'OK', { 'X-Imbo-Imageidentifier': catMd5 });

            client.deleteImage(catMd5, function(err, res) {
                assert.equal(res.headers['x-imbo-imageidentifier'], catMd5);
                done();
            });
        });
    });

    describe('#imageIdentifierExists', function() {
        it('should return true if the identifier exists', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(200, 'OK');

            client.imageIdentifierExists(catMd5, function(err, exists) {
                assert.ifError(err, 'Image that exists should not give an error');
                assert.equal(true, exists);
                done();
            });
        });

        it('should return false if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(404, 'Image not found');

            client.imageIdentifierExists(catMd5, function(err, exists) {
                assert.ifError(err, 'imageIdentifierExists should not fail when image does not exist on server');
                assert.equal(false, exists);
                done();
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
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images?page=1&limit=1&originalChecksums[]=' + catMd5)
                .reply(200, {
                    search: { hits: 1 },
                    images: [ { imageIdentifier: catMd5 } ]
                }, {
                    'Content-Type': 'application/json'
                });

            client.imageExists(fixtures + '/cat.jpg', function(err, exists) {
                assert.ifError(err, 'imageExists should not give error if image exists on disk and server');
                assert.equal(true, exists);
                done();
            });
        });

        it('should return false if the image exists on disk but not on server', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images?page=1&limit=1&originalChecksums[]=' + catMd5)
                .reply(200, {
                    search: { hits: 0 },
                    images: []
                }, {
                    'Content-Type': 'application/json'
                });

            client.imageExists(fixtures + '/cat.jpg', function(err, exists) {
                assert.ifError(err, 'imageExists should not give error if the image does not exist on server');
                assert.equal(false, exists);
                done();
            });
        });
    });

    describe('#imageWithChecksumExists', function() {
        it('should return true if the image exists on server', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images?page=1&limit=1&originalChecksums[]=' + catMd5)
                .reply(200, {
                    search: { hits: 1 },
                    images: [ { imageIdentifier: catMd5 } ]
                }, {
                    'Content-Type': 'application/json'
                });

            client.imageWithChecksumExists(catMd5, function(err, exists) {
                assert.ifError(err, 'imageWithChecksumExists should not give error if image exists on server');
                assert.equal(true, exists);
                done();
            });
        });

        it('should return false if the image does exist on server', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images?page=1&limit=1&originalChecksums[]=' + catMd5)
                .reply(200, {
                    search: { hits: 0 },
                    images: []
                }, {
                    'Content-Type': 'application/json'
                });

            client.imageWithChecksumExists(catMd5, function(err, exists) {
                assert.ifError(err, 'imageWithChecksumExists should not give error if the image does not exist on server');
                assert.equal(false, exists);
                done();
            });
        });

        it('should give back error if encountering server issues', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images?page=1&limit=1&originalChecksums[]=' + catMd5)
                .reply(503, 'Internal Server Error');

            client.imageWithChecksumExists(catMd5, function(err, exists) {
                assert.ok(err, 'imageWithChecksumExists should not give error if the image does not exist on server');
                done();
            });
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
            mock.filteringPath(signatureCleaner)
                .filteringRequestBody(bodyCleaner)
                .post('/users/pub/images', '*')
                .reply(400, 'Image already exists', { 'X-Imbo-Imageidentifier': catMd5 });


            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier) {
                assert.equal(400, err);
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
            mock.filteringPath(signatureCleaner)
                .filteringRequestBody(bodyCleaner)
                .post('/users/pub/images', '*')
                .reply(201, { imageIdentifier: catMd5 }, {
                    'X-Imbo-ImageIdentifier': catMd5,
                    'Content-Type': 'application/json'
                });

            client.addImage(fixtures + '/cat.jpg', function(err, imageIdentifier, body, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(catMd5, body.imageIdentifier);
                assert.equal(201, response.statusCode);

                done();
            });
        });

    });

    describe('#addImageFromBuffer', function() {
        it('should return an error if the image could not be added', function(done) {
            mock.filteringPath(signatureCleaner)
                .filteringRequestBody(bodyCleaner)
                .post('/users/pub/images', '*')
                .reply(400, 'Image already exists', {
                    'X-Imbo-Imageidentifier': catMd5
                });

            var buffer = fs.readFileSync(fixtures + '/cat.jpg');
            client.addImageFromBuffer(buffer, function(err, imageIdentifier) {
                assert.equal(400, err);
                assert.equal(null, imageIdentifier);
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .filteringRequestBody(bodyCleaner)
                .post('/users/pub/images', '*')
                .reply(201, { imageIdentifier: catMd5 }, {
                    'X-Imbo-Imageidentifier': catMd5,
                    'Content-Type': 'application/json'
                });

            var buffer = fs.readFileSync(fixtures + '/cat.jpg');
            client.addImageFromBuffer(buffer, function(err, imageIdentifier, body, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(catMd5, body.imageIdentifier);
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

        it('should return an error if the image could not be added', function(done) {
            mock.filteringPath(signatureCleaner)
                .filteringRequestBody(bodyCleaner)
                .post('/users/pub/images', '*')
                .reply(400, 'Image already exists', {
                    'X-Imbo-Imageidentifier': catMd5
                });


            client.addImageFromUrl(stcUrl + '/cat.jpg', function(err, imageIdentifier) {
                assert.equal(400, err);
                assert.equal(null, imageIdentifier);
                done();
            });
        });

        it('should return an image identifier and an http-response on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .filteringRequestBody(bodyCleaner)
                .post('/users/pub/images', '*')
                .reply(201, { imageIdentifier: catMd5 }, {
                    'X-Imbo-ImageIdentifier': catMd5,
                    'Content-Type': 'application/json'
                });

            mock.get('/cat.jpg')
                .reply(200, fs.readFileSync(fixtures + '/cat.jpg'), {
                    'Content-Type': 'image/jpeg',
                    'Content-Length': fs.statSync(fixtures + '/cat.jpg').size
                });

            client.addImageFromUrl('http://imbo/cat.jpg', function(err, imageIdentifier, body, response) {
                assert.equal(undefined, err);
                assert.equal(catMd5, imageIdentifier);
                assert.equal(catMd5, body.imageIdentifier);
                assert.equal(201, response.statusCode);

                done();
            });
        });

    });

    describe('#getUserInfo', function() {
        it('should return an object of key => value data', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub')
                .reply(200, JSON.stringify({ 'foo': 'bar' }), { 'Content-Type': 'application/json' });

            client.getUserInfo(function(err, info, res) {
                assert.ifError(err, 'getUserInfo should not give an error on success');
                assert.equal('bar', info.foo);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return an error if the user does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub')
                .reply(404, 'Not Found');

            client.getUserInfo(function(err, body, res) {
                assert.equal(404, err);
                assert.equal('Not Found', body);
                assert.equal(404, res.statusCode);
                done();
            });
        });

        it('should convert lastModified key to a Date instance', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub')
                .reply(200, JSON.stringify({
                    'lastModified': 'Fri, 14 Mar 2014 07:43:49 GMT'
                }), { 'Content-Type': 'application/json' });

            client.getUserInfo(function(err, info, res) {
                assert.ifError(err, 'getUserInfo should not give an error on success');
                assert.ok(info.lastModified instanceof Date);
                assert.equal(200, res.statusCode);
                done();
            });
        });
    });

    describe('#getImageProperties', function() {
        it('should return an object on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/' + catMd5)
                .reply(200, 'OK', {
                    'X-Imbo-OriginalWidth'    : 123,
                    'X-Imbo-OriginalHeight'   : 456,
                    'X-Imbo-OriginalFilesize' : 123456,
                    'X-Imbo-OriginalExtension': 'png',
                    'X-Imbo-OriginalMimeType' : 'image/png'
                });

            client.getImageProperties(catMd5, function(err, props) {
                assert.ifError(err, 'getImageProperties() should not give an error on success');
                assert.equal(123,         props.width);
                assert.equal(456,         props.height);
                assert.equal(123456,      props.filesize);
                assert.equal('png',       props.extension);
                assert.equal('image/png', props.mimetype);
                done();
            });
        });

        it('should return an error if the image does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .head('/users/pub/images/f00baa')
                .reply(404, 'Not Found');

            client.getImageProperties('f00baa', function(err, props) {
                assert.equal(404, err);
                assert.equal(undefined, props);
                done();
            });
        });
    });

    describe('#getImageData', function() {
        it('should return a buffer on success', function(done) {
            var expectedBuffer = new Buffer('str');

            mockImgUrl.filteringPath(signatureCleaner)
                .get('/users/pub/images/' + catMd5)
                .reply(200, expectedBuffer);

            client.getImageData(catMd5, function(err, data) {
                assert.ifError(err, 'getImageData() should not give an error on success');
                assert.equal('str', data);
                done();
            });
        });

        it('should return an error if the image does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images/f00baa')
                .reply(404, 'Not Found');

            client.getImageData('f00baa', function(err, data) {
                assert.equal(404, err);
                assert.equal(undefined, data);
                done();
            });
        });
    });

    describe('#getNumImages', function() {
        it('should return a number on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub')
                .reply(200, JSON.stringify({ 'numImages': 50 }), { 'Content-Type': 'application/json' });

            client.getNumImages(function(err, numImages) {
                assert.ifError(err, 'getNumImages() should not give an error on success');
                assert.equal(50, numImages);
                done();
            });
        });

        it('should return an error if the user does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub')
                .reply(404, 'Not Found');

            client.getNumImages(function(err, numImages) {
                assert.equal(404, err);
                assert.equal(undefined, numImages);
                done();
            });
        });
    });

    describe('#getImages', function() {
        it('should return an object of key => value data', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images')
                .reply(200, JSON.stringify({ 'images': [], 'search': { 'hits': 3 } }), {
                    'Content-Type': 'application/json'
                });

            client.getImages(function(err, images, search, res) {
                assert.ifError(err, 'getImages should not give an error on success');
                assert.equal(3, search.hits);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return an error if the user does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images')
                .reply(404, 'User not found');

            client.getImages(function(err, images, search, res) {
                assert.equal(404, err);
                assert.equal(404, res.statusCode);
                done();
            });
        });

        it('should allow an optional query', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images?page=1&limit=5&ids[]=blah')
                .reply(200, JSON.stringify({ 'images': [], 'search': { 'hits': 0 } }), {
                    'Content-Type': 'application/json'
                });

            var query = new Imbo.Query().limit(5).ids(['blah']);
            client.getImages(query, function(err, images, search, res) {
                assert.ifError(err, 'getImages should not give an error on success');
                assert.equal(0,   search.hits);
                assert.equal(200, res.statusCode);
                done();
            });
        });
    });

    describe('#getMetadata', function() {
        it('should return an object of key => value data', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images/' + catMd5 + '/meta')
                .reply(200, JSON.stringify({ 'foo': 'bar' }), { 'Content-Type': 'application/json' });

            client.getMetadata(catMd5, function(err, meta, res) {
                assert.ifError(err, 'getMetadata should not give error on success');
                assert.equal('bar', meta.foo);
                assert.equal(200, res.statusCode);
                done();
            });
        });

        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .get('/users/pub/images/f00baa/meta')
                .reply(404, 'Image not found');

            client.getMetadata('f00baa', function(err, body, res) {
                assert.equal(404, err);
                assert.equal('Image not found', body);
                assert.equal(404, res.statusCode);
                done();
            });
        });
    });

    describe('#deleteMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/f00baa/meta', 'DELETE')
                .reply(404, 'Image not found');

            client.deleteMetadata('f00baa', function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            mock.filteringPath(signatureCleaner)
                .intercept('/users/pub/images/' + catMd5 + '/meta', 'DELETE')
                .reply(200, 'OK');

            client.deleteMetadata(catMd5, function(err) {
                assert.ifError(err, 'deleteMetadata should not give error on success');
                done();
            });
        });
    });

    describe('#editMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .post('/users/pub/images/f00baa/meta', { foo: 'bar' })
                .reply(404, 'Image not found');

            client.editMetadata('f00baa', { foo: 'bar' }, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            var response = { foo: 'bar', existing: 'key' };
            mock.filteringPath(signatureCleaner)
                .post('/users/pub/images/' + catMd5 + '/meta', { foo: 'bar' })
                .reply(200, response, {
                    'Content-Type': 'application/json'
                });

            client.editMetadata(catMd5, { foo: 'bar' }, function(err, body, res) {
                assert.ifError(err, 'editMetadata should not give error on success');
                assert.equal(200, res.statusCode);
                assert.equal(JSON.stringify(response), JSON.stringify(body));
                done();
            });
        });
    });

    describe('#replaceMetadata', function() {
        it('should return an error if the identifier does not exist', function(done) {
            mock.filteringPath(signatureCleaner)
                .put('/users/pub/images/f00baa/meta', { foo: 'bar' })
                .reply(404, 'Image not found');

            client.replaceMetadata('f00baa', { foo: 'bar' }, function(err) {
                assert.equal(404, err);
                done();
            });
        });

        it('should not return any error on success', function(done) {
            var responseBody = { foo: 'bar', some: 'key' },
                sentData     = { some: 'key', foo: 'bar' };

            mock.filteringPath(signatureCleaner)
                .put('/users/pub/images/' + catMd5 + '/meta', sentData)
                .reply(200, responseBody, {
                    'Content-Type': 'application/json'
                });

            client.replaceMetadata(catMd5, sentData, function(err, body, res) {
                assert.ifError(err, 'replaceMetadata should not give error on success');
                assert.equal(200, res.statusCode);
                assert.equal(responseBody.foo, body.foo);
                assert.equal(responseBody.some, body.some);
                assert.equal(
                    Object.keys(responseBody).length,
                    Object.keys(body).length
                );

                done();
            });
        });
    });

});
