'use strict';
var through = require('through');
var mountFolder = function(connect, dir) {
    return connect.static(require('path').resolve(dir));
};

module.exports = function(grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            options: {
                nospawn: false
            },

            browserify: {
                files: [
                    'lib/**/*.js',
                    'test/**/*.js'
                ],
                tasks: [
                    'browserify:all',
                    'mochaTest'
                ],
                options: {
                    debounceDelay: 500
                }
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },

            build: {
                src: 'dist/browser-bundle.js',
                dest: 'dist/browser-bundle.min.js'
            }
        },

        connect: {
            options: {
                port: 7911,
                hostname: 'localhost'
            },
            test: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test')
                        ];
                    }
                }
            }
        },

        clean: {
            server: '.tmp'
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            all: [
                'Gruntfile.js',
                'lib/{,*/}*.js',
                'test/unit/{,*/}*.js'
            ]
        },

        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>'
            }
        },

        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.options.port %>/index.html']
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    reporter: 'spec'
                },
                src: ['test/unit/*.js']
            }
        },

        browserify: {
            all: {
                src: 'index.js',
                dest: 'dist/browser-bundle.js',
                options: {
                    'standalone': 'Imbo',
                    'transform': [
                        // Replace node-specific components with browser-specific ones
                        function() {
                            var data = '';
                            return through(
                                function(buf) { data += buf; },
                                function() {
                                    this.queue(data.replace(/\.\/node\//g, './browser/'));
                                    this.queue(null);
                                }
                            );
                        }
                    ]
                },
            },
        }
    });

    grunt.registerTask('test', [
        'clean:server',
        'browserify',
        'connect:test',
        'mochaTest'
    ]);

    // Default task(s).
    grunt.registerTask('default', [
        'browserify',
        'uglify'
    ]);

};
