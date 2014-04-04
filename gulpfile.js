'use strict';

var gulp       = require('gulp'),
    mocha      = require('gulp-mocha'),
    istanbul   = require('gulp-istanbul'),
    gutil      = require('gulp-util'),
    browserify = require('gulp-browserify'),
    clean      = require('gulp-clean'),
    rename     = require('gulp-rename'),
    uglify     = require('gulp-uglify'),
    replace    = require('gulp-replace'),
    insert     = require('gulp-insert'),
    jshint     = require('gulp-jshint'),
    through    = require('through'),
    pkgInfo    = require('./package.json'),
    banner     = [
        '/*!', pkgInfo.name, 'v', pkgInfo.version,
        new Date().toISOString().substr(0, 10), '*/\n'
    ].join(' ');

// Replace node-specific components with browser-specific ones
function browserSpecific() {
    var data = '';
    return through(
        function(buf) { data += buf; },
        function() {
            this.queue(data.replace(/\.\/node\//g, './browser/'));
            this.queue(null);
        }
    );
}

gulp.task('clean', function() {
    gulp.src('./dist', { read: false })
        .pipe(clean());
});

gulp.task('watch', function() {
    gulp.watch(
        ['./lib/**/*.js', './test/**/*.js'],
        ['tests']
    );
});

gulp.task('lint', function() {
    gulp.src(['./gulpfile.js', './lib/**/*.js', '!./lib/**/*.min.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('tests', function(cb) {
    gulp.src(['./lib/**/*.js'])
        .pipe(istanbul())
        .on('end', function() {
            gulp.src(['./test/unit/*.js', './test/integration/*.js'], { read: false })
                .pipe(mocha({ reporter: 'spec' }))
                .pipe(istanbul.writeReports())
                .on('error', gutil.log)
                .on('end', cb);
        });
});

gulp.task('test', ['tests'], function() {
    process.exit(0);
});

gulp.task('browserify', function(cb) {
    gulp.src('./index.js')
        .pipe(browserify({
            'standalone': 'Imbo',
            'transform': [
                browserSpecific,
                'workerify'
            ]
        }))
        .pipe(rename('browser-bundle.js'))
        .pipe(replace(new RegExp(__dirname, 'g'), '.'))
        .pipe(gulp.dest('./dist'))
        .on('end', cb);
});

gulp.task('uglify', function(cb) {
    gulp.src('./dist/browser-bundle.js')
        .pipe(rename('browser-bundle.min.js'))
        .pipe(uglify({ outSourceMap: true }))
        .pipe(insert.prepend(banner))
        .pipe(gulp.dest('./dist'))
        .on('end', cb);
});

gulp.task('default', ['clean', 'lint', 'browserify', 'uglify']);
