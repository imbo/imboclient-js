var through = require('through');

module.exports = function(grunt) {
    'use strict';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        watch: {
            browserify: {
                files: ['lib/**/*.js'],
                tasks: ['browserify:all'],
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

        browserify: {
            all: {
                src: 'lib/client.js',
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
                                    this.queue(data.replace(/\.\/node\//, './browser/'));
                                    this.queue(null);
                                }
                            );
                        }
                    ]
                },
            },
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    // Default task(s).
    grunt.registerTask('default', [
        'browserify',
        'uglify'
    ]);

};
