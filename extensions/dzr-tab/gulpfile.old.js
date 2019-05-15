'use strict';

var gulp = require('gulp');
var	del = require('del');
var	uglify = require('gulp-uglify');
var	cleanCSS = require('gulp-clean-css');
var	htmlmin = require('gulp-htmlmin');
var	jsonminify = require('gulp-jsonminify');
var	imagemin = require('gulp-imagemin');
var	zip = require('gulp-zip');

const CONF = {
	path: {
		src: 'src/',
		build: 'build/'
	},
	css: {
		files: [
			'css/main.css'
		],
		file: 'css/main.min.css'
	}
};

gulp.task('default', ['minify'], function () {

	gulp.src(DEST + '**/**')
		.pipe(zip('deezer-tab.zip'))
		.pipe(gulp.dest(DEST));

});

gulp.task('clean', function () {

	return del(DEST + '*');

});

gulp.task('move', ['clean'], function () {

	return gulp.src([
		'!{node_modules,node_modules/**}', '!gulpfile.js',
		'**/*.js',
		'**/*.json',
		'**/*.css',
		'**/*.svg',
		'**/*.png',
		'**/*.html',
	]).pipe(gulp.dest(DEST));

});

gulp.task('minify', ['minify-js', 'minify-css', 'minify-html', 'minify-img', 'minify-json']);

gulp.task('minify-js', ['move'], function () {

	return gulp.src([DEST + '**/*.js'])
		.pipe(uglify())
		.pipe(gulp.dest(DEST));

});

// gulp.task('minify-css', ['move'], function () {

// 	return gulp.src(DEST + '**/*.css')
// 		.pipe(cleanCSS())
// 		.pipe(gulp.dest(DEST));

// });

gulp.task('minify-css', function () {

	return gulp.src([
			CONF.path.src + 'css/*.css'
		])
		.pipe(cleanCSS({
			rebase: false,
			level: {
				1: {
					specialComments: 0
				}
			}
		}))
		.pipe(concat(CONF.css.file))
		.pipe(gulp.dest(CONF.path.build));

});

gulp.task('minify-html', ['move'], function () {

	return gulp.src(DEST + '**/*.html')
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		.pipe(gulp.dest(DEST));

});

gulp.task('minify-img', ['move'], function () {

	return gulp.src([DEST + '**/*.svg', DEST + '**/*.png'])
		.pipe(imagemin())
		.pipe(gulp.dest(DEST));

});

gulp.task('minify-json', ['move'], function () {

	return gulp.src(DEST + '**/*.json')
		.pipe(jsonminify())
		.pipe(gulp.dest(DEST));

});