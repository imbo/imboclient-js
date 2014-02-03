'use strict';
var through = require('through');
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
                    'test'
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

        mochacov: {
            options: {
                files: [
                    'test/unit/*.js',
                    'test/integration/*.js'
                ]
            },

            coverage: {
                options: {
                    reporter: 'html-cov',
                    output: 'coverage.html'
                }
            },

            test: {
                options: {
                    reporter: 'spec'
                }
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
                        },
                        'workerify'
                    ]
                },
            },
        },

        replace: {
            coverage: {
                options: {
                    patterns: [{
                        match: new RegExp(__dirname + '/lib/', 'g'),
                        replacement: '',
                        expression: true
                    }]
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: ['coverage.html']
                }]
            }
        }
    });

    grunt.registerTask('test', [
        'mochacov:test',
        'mochacov:coverage',
        'replace:coverage'
    ]);

    grunt.registerTask('default', [
        'browserify',
        'uglify'
    ]);

};
