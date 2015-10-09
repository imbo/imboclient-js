/* eslint no-console: 0 */
'use strict';

// Include the essentials
var Imbo = require('./index'),
    path = require('path'),
    async = require('async');

var imgPath = path.join(__dirname, 'test', 'fixtures', 'cat.jpg');
var imgUrl = 'http://1.vgc.no/drpublish/images/article/2010/06/22/22295800/1/834x556/1658882.jpg';
var imboHost = process.env.IMBO_HOST || 'http://imbo2';

// Define some resources for later use
var roResources = [
    'user.get',
    'user.head',
    'user.options',
    'image.get',
    'image.head',
    'image.options',
    'groups.get',
    'groups.head',
    'groups.options',
    'images.get',
    'images.head',
    'images.options',
    'metadata.get',
    'metadata.head',
    'metadata.options',
    'shorturl.get',
    'shorturl.head',
    'shorturl.options',
    'globalimages.get',
    'globalimages.head',
    'globalimages.options',
    'shorturls.options',
];

var rwResources = [
    'image.delete',
    'images.post',
    'metadata.post',
    'metadata.delete',
    'metadata.put',
    'shorturl.delete',
    'shorturls.post',
    'shorturls.delete',
].concat(roResources);

// Instantiating clients
var masterClient, masterVaffelClient;
var krabbaClient, rexxarsClient;
var krabbaVaffelClient, rexxarsVaffelClient;

createClients();

// Perform full flow
async.series([
    sanityCheck,
    createResourceGroups,
    addPubKeys,
    addAclRuleSets,
    addImagesToOwnUsers,
    getImagesFromDifferentUser,
    addImagesToCommonUser,
    getImagesFromCommonUser,
    addImagesFromUrl,
    getUserInfo,
    getSharedUserInfo,
    getUserInfoWithIncorrectAccessLevel,
    getImageProperties,
    editMetadata,
    deleteMetadata
], function(err) {
    throwOnError(err);

    console.log('========');
    console.log('Success!');
    console.log('========');
});

// Create two new resource groups: `read-only` and `read-write`
function createResourceGroups(cb) {
    masterClient.editResourceGroup('read-only', roResources, function(roGroupErr) {
        throwOnError(roGroupErr);

        masterClient.editResourceGroup('read-write', rwResources, cb);
    });
}

// Add two public keys:
// `rexxars` - private key: 'hovlandsdal'
// `krabba`  - private key: 'brabrand'
function addPubKeys(cb) {
    masterClient.addPublicKey('rexxars', 'hovlandsdal', function(ehErr) {
        throwOnError(ehErr);
        masterClient.addPublicKey('krabba', 'brabrand', cb);
    });
}

// Add rulesets for the two public keys
// `rexxars` has read-write access to `espenh`
// `rexxars` has read-only access to `vaffel`
// `rexxars` has access to specific resources `groups.get` and `groups.options`
// `krabba` has read-write access to `kbrabrand`
// `krabba` has read-only access to `vaffel`
// `krabba` has access to specific resources `groups.get` and `groups.options`
function addAclRuleSets(cb) {
    var rules = [
        { publicKey: 'rexxars', rule: { 'group': 'read-write', 'users': ['espenh'] } },
        { publicKey: 'rexxars', rule: { 'group': 'read-only',  'users': ['vaffel'] } },
        { publicKey: 'rexxars', rule: { 'resources': ['groups.get', 'groups.options'], users: ['espenh'] } },
        { publicKey: 'krabba',  rule: { 'group': 'read-write', 'users': ['kbrabrand'] } },
        { publicKey: 'krabba',  rule: { 'group': 'read-only',  'users': ['vaffel'] } },
        { publicKey: 'krabba',  rule: { 'resources': ['groups.get', 'groups.options'], users: ['kbrabrand'] } }
    ];

    async.eachSeries(rules, function(def, callback) {
        masterClient.addAccessControlRule(def.publicKey, def.rule, callback);
    }, cb);
}

// Add images to "their own" users
function addImagesToOwnUsers(cb) {
    krabbaClient.addImage(imgPath, function(err) {
        throwOnError(err);

        rexxarsClient.addImage(imgPath, cb);
    });
}

// Try to get the images of a user it should not have access to
// EG: Should fail
function getImagesFromDifferentUser(cb) {
    var rexxarsFailClient = new Imbo.Client({
        hosts: imboHost,
        user: 'kbrabrand',
        publicKey: 'rexxars',
        privateKey: 'hovlandsdal'
    });

    var krabbaFailClient = new Imbo.Client({
        hosts: imboHost,
        user: 'rexxars',
        publicKey: 'krabba',
        privateKey: 'brabrand'
    });

    rexxarsFailClient.getImages(function(err) {
        if (!err || err.statusCode !== 400 || err.message.indexOf('Permission denied') === -1) {
            return cb(new Error('Client had access to a resource it shouldn\'t have had'));
        }

        krabbaFailClient.getImages(function(crabErr) {
            if (!crabErr || crabErr.statusCode !== 400 || crabErr.message.indexOf('Permission denied') === -1) {
                return cb(new Error('Client had access to a resource it shouldn\'t have had'));
            }

            cb();
        });
    });
}

// Add image to "common" / "shared" user
function addImagesToCommonUser(cb) {
    masterVaffelClient.addImage(imgPath, cb);
}

// List the images from a common/shared user
function getImagesFromCommonUser(cb) {
    async.parallel([
        function(callback) {
            krabbaVaffelClient.getImages(function(err, imgs) {
                var noImgErr = imgs.length !== 1 ? new Error('No images found on vaffel user, expected 1') : null;
                callback(err || noImgErr);
            });
        },
        function(callback) {
            rexxarsVaffelClient.getImages(function(err, imgs) {
                var noImgErr = imgs.length !== 1 ? new Error('No images found on vaffel user, expected 1') : null;
                callback(err || noImgErr);
            });
        }
    ], cb);
}

// Add an image from a URL
function addImagesFromUrl(cb) {
    async.parallel([
        function(callback) {
            krabbaClient.addImageFromUrl(imgUrl, callback);
        },
        function(callback) {
            rexxarsClient.addImageFromUrl(imgUrl, callback);
        }
    ], cb);
}

// Get user info for each of the users
function getUserInfo(cb) {
    async.parallel([
        function(callback) {
            masterVaffelClient.getUserInfo(callback);
        },
        function(callback) {
            krabbaClient.getUserInfo(callback);
        },
        function(callback) {
            rexxarsClient.getUserInfo(callback);
        }
    ], cb);
}

// Get user info for each of the users
function getSharedUserInfo(cb) {
    async.parallel([
        function(callback) {
            krabbaClient.user('vaffel').getUserInfo(function(err) {
                krabbaClient.user('kbrabrand');
                callback(err);
            });
        },
        function(callback) {
            rexxarsClient.user('vaffel').getUserInfo(function(err) {
                rexxarsClient.user('espenh');
                callback(err);
            });
        }
    ], cb);
}

// Try to get user info for a user it does not have access to
function getUserInfoWithIncorrectAccessLevel(cb) {
    var errStr = 'Should fail when trying to access user without correct credentials';
    async.parallel([
        function(callback) {
            krabbaClient.user('espenh').getUserInfo(function(err) {
                krabbaClient.user('kbrabrand');
                callback(!err ? new Error(errStr) : null);
            });
        },
        function(callback) {
            rexxarsClient.user('kbrabrand').getUserInfo(function(err) {
                rexxarsClient.user('espenh');
                callback(!err ? new Error(errStr) : null);
            });
        }
    ], cb);
}

// See that we can get some image properties from own/shared images
function getImageProperties(cb) {
    async.parallel([
        function(callback) {
            getFirstImageIdentifier(krabbaClient, function(err, imageIdentifier) {
                if (err) {
                    return callback(err);
                }

                krabbaClient.getImageProperties(imageIdentifier, function(imgErr, info) {
                    if (imgErr) {
                        return callback(imgErr);
                    }

                    callback(info.extension !== 'jpg' && new Error('Image extension should have been JPG'));
                });
            });
        },
        function(callback) {
            rexxarsClient.user('vaffel');
            getFirstImageIdentifier(rexxarsClient, function(err, imageIdentifier) {
                if (err) {
                    return callback(err);
                }

                rexxarsClient.getImageProperties(imageIdentifier, function(imgErr, info) {
                    rexxarsClient.user('espenh');
                    if (imgErr) {
                        return callback(imgErr);
                    }

                    callback(info.extension !== 'jpg' && new Error('Image extension should have been JPG'));
                });
            });
        },
    ], cb);
}

// Edit some metadata with one client, read it with the other
function editMetadata(cb) {
    var imageId;
    getFirstImageIdentifier(masterVaffelClient, function(err, imageIdentifier) {
        if (err) {
            return cb(err);
        }

        imageId = imageIdentifier;
        masterVaffelClient.replaceMetadata(imageId, { foo: { bar: { baz: 'ZING' } } }, function(metaErr) {
            if (metaErr) {
                return cb(metaErr);
            }

            krabbaClient.user('vaffel').getMetadata(imageId, function(metaGetErr, meta) {
                krabbaClient.user('kbrabrand');
                if (!metaGetErr && meta.foo.bar.baz !== 'ZING') {
                    metaGetErr = new Error('Metadata did not have the expected value :(');
                }

                if (metaGetErr) {
                    return cb(metaGetErr);
                }

                cb();
            });
        });
    });
}

// Delete the previous metadata with one client, read it with the other
function deleteMetadata(cb) {
    var imageId;
    getFirstImageIdentifier(masterVaffelClient, function(err, imageIdentifier) {
        if (err) {
            return cb(err);
        }

        imageId = imageIdentifier;
        masterVaffelClient.deleteMetadata(imageId, function(metaErr) {
            if (metaErr) {
                return cb(metaErr);
            }

            krabbaClient.user('vaffel').getMetadata(imageId, function(metaGetErr, meta) {
                krabbaClient.user('kbrabrand');
                if (!metaGetErr && meta && meta.foo) {
                    metaGetErr = new Error('Metadata did not have the expected value :(');
                }

                if (metaGetErr) {
                    return cb(metaGetErr);
                }

                cb();
            });
        });
    });
}

// Shorturl magic
function shortUrlMagic() {

}

// Check that our credentials are in order and reset to a known state
function sanityCheck(callback) {
    masterClient.getResourceGroups(function(err, groups, search) {
        if (err && err.message.indexOf('public key') && err.statusCode === 400) {
            console.error('Public/private key error - did you create the master user?');
            console.error('(master / password)');
            process.exit(1);
        } else {
            throwOnError(err);
        }

        async.parallel([
            function(cb) {
                deleteAllImages(masterVaffelClient, function() { cb(); });
            },
            function(cb) {
                deleteAllImages(rexxarsClient, function() { cb(); });
            },
            function(cb) {
                deleteAllImages(krabbaClient, function() { cb(); });
            }
        ], function() {
            async.parallel([
                function(cb) {
                    masterClient.deletePublicKey('rexxars', function() { cb(); });
                },
                function(cb) {
                    masterClient.deletePublicKey('krabba', function() { cb(); });
                },
                function(cb) {
                    masterClient.deleteResourceGroup('read-only', function() { cb(); });
                },
                function(cb) {
                    masterClient.deleteResourceGroup('read-write', function() { cb(); });
                }
            ], callback);
        });
    });
}

/**
 * Helpers
 */
function throwOnError(err) {
    if (err) {
        throw err;
    }
}

function deleteAllImages(client, cb) {
    client.getImages(
        (new Imbo.Query()).limit(100),
        function(err, images) {
            if (err) {
                return cb(err);
            }

            async.each(images, function(img, callback) {
                client.deleteImage(img.imageIdentifier, callback);
            }, cb);
        }
    );
}

function getFirstImageIdentifier(client, cb) {
    client.getImages(
        (new Imbo.Query()).limit(1),
        function(err, images) {
            cb(err, err ? null : images[0].imageIdentifier);
        }
    );
}

// Create clients
function createClients() {
    masterClient = new Imbo.Client({
        hosts: imboHost,
        user: 'master',
        publicKey: 'master',
        privateKey: 'password'
    });

    masterVaffelClient = new Imbo.Client({
        hosts: imboHost,
        user: 'vaffel',
        publicKey: 'master',
        privateKey: 'password'
    });

    krabbaClient = new Imbo.Client({
        hosts: imboHost,
        user: 'kbrabrand',
        publicKey: 'krabba',
        privateKey: 'brabrand'
    });

    rexxarsClient = new Imbo.Client({
        hosts: imboHost,
        user: 'espenh',
        publicKey: 'rexxars',
        privateKey: 'hovlandsdal'
    });

    krabbaVaffelClient = new Imbo.Client({
        hosts: imboHost,
        user: 'vaffel',
        publicKey: 'krabba',
        privateKey: 'brabrand'
    });

    rexxarsVaffelClient = new Imbo.Client({
        hosts: imboHost,
        user: 'vaffel',
        publicKey: 'rexxars',
        privateKey: 'hovlandsdal'
    });
}
