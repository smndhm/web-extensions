'use strict';

var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var htmlreplace = require('gulp-html-replace');
var jsonminify = require('gulp-jsonminify');
var	imagemin = require('gulp-imagemin');
var	del = require('del');
var	zip = require('gulp-zip');

const CONF = {
	paths: {
		src: 'src/',
		build: 'build/'
	},
	css: {
		files: [
			// 'css/*.css',
			'css/style.css',
		],
		file: 'css/style.min.css'
	},
	js: {
		files: [
			// 'js/*.js,
			'js/params.js',
			'js/tab.js',
			'js/tools.js',
		],
		file: 'js/script.min.css',
	},
	html: {
		files: [
			'index.html',
		]
	},
	json: {
		files: [
			'manifest.json',
		]
	},
	img: {
		files: [
			'**/*.svg',
			'**/*.png',
		]
	},
	move: {
		files: [
			'**/*.woff',
			'**/*.woff2',
		]
	},
	zip: {
		file: 'dzr-tab.zip'
	}
};

gulp.task('minify-css', function () {

	return gulp.src(CONF.css.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(cleanCSS({
			rebase: false,
			level: {
				1: {
					specialComments: 0
				}
			}
		}))
		.pipe(concat(CONF.css.file))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('minify-js', function () {

	return gulp.src(CONF.js.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(uglify())
		.pipe(concat(CONF.js.file))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('minify-html', function () {

	return gulp.src(CONF.html.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(htmlreplace({
			'css': CONF.css.file,
			'js': CONF.js.file
		}))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('minify-json', function () {

	return gulp.src(CONF.json.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(jsonminify())
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('minify-img', function () {

	return gulp.src(CONF.img.files.map(function (file) {
		return CONF.paths.src + file
	}))
		.pipe(imagemin({
			verbose: true
		}))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('minify-all', gulp.parallel('minify-css', 'minify-js', 'minify-html', 'minify-json', 'minify-img'));

gulp.task('move', function () {

	return gulp.src(CONF.move.files.map(function (file) {
		return CONF.paths.src + file
	}))
	.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('clean', function () {

	return del(CONF.paths.build);

});

gulp.task('zip', function () {

	return gulp.src(CONF.paths.build + '*')
		.pipe(zip(CONF.zip.file))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('default', gulp.series('clean', gulp.parallel('move', 'minify-all'), 'zip'));