'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var browserify = require('gulp-browserify');
var rimraf = require('gulp-rimraf');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var replace = require('gulp-replace');
var insert = require('gulp-insert');
var eslint = require('gulp-eslint');
var through = require('through');
var pkgInfo = require('./package.json');

var mochaOpts = { reporter: 'spec' };
var codePaths = ['lib/**/*.js', 'gulpfile.js', '!./lib/**/*.min.js'];
var lintCodePaths = codePaths.concat(['test/**/*.js']);
var banner = [
    '/*!', pkgInfo.name, 'v', pkgInfo.version,
    new Date().toISOString().substr(0, 10), '*/\n'
].join(' ');

// Replace node-specific components with browser-specific ones
function browserSpecific() {
    var data = '';
    return through(
        function(buf) {
            data += buf;
        },
        function() {
            this.queue(data.replace(/\.\/node\//g, './browser/'));
            this.queue(null);
        }
    );
}

gulp.task('clean', function() {
    gulp.src('./dist', { read: false })
        .pipe(rimraf());
});

gulp.task('watch', function() {
    gulp.watch(
        ['./lib/**/*.js', './test/**/*.test.js'],
        ['test']
    );
});

gulp.task('lint', function() {
    return gulp.src(lintCodePaths)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('coveragePrepare', function() {
    return gulp.src(codePaths)
        .pipe(istanbul({}))
        .pipe(istanbul.hookRequire());
});

gulp.task('coverage', ['coveragePrepare'], function() {
    return getMochaStream().pipe(istanbul.writeReports());
});

gulp.task('mocha', getMochaStream);

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

gulp.task('default', ['clean', 'lint', 'coverage', 'browserify'], function() {
    gulp.start('uglify');
});

gulp.task('test', ['lint', 'mocha']);

function getMochaStream() {
    return gulp.src('test/**/*.test.js')
       .pipe(mocha(mochaOpts));
}
