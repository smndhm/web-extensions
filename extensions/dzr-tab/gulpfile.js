'use strict';

var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var htmlreplace = require('gulp-html-replace');
var jsonminify = require('gulp-jsonminify');
var imagemin = require('gulp-imagemin');
var del = require('del');
var zip = require('gulp-zip');
var jeditor = require("gulp-json-editor");

const CONF = {
	paths: {
		src: 'src/',
		build: 'build/',
		tmp: '.tmp/'
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
			'../node_modules/node-vibrant/dist/vibrant.min.js',
			'js/utils.js',
			'js/tab.js',
			'js/script.js',
		],
		file: 'js/script.min.js',
	},
	html: {
		files: [
			'index.html',
		]
	},
	json: {
		files: [
			'manifest.json',
		],
		manifest: 'manifest.json'
	},
	img: {
		files: [
			'**/*.svg',
			'**/*.png',
		],
		logo: 'css/img/deezer.svg'
	},
	move: {
		files: [
			'**/*.woff',
			'**/*.woff2',
		]
	},
	zip: {
		file: 'dzr-tab.zip',
		firefox : 'dzr-tab-ff.zip'
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
		.pipe(gulp.dest(CONF.paths.tmp));

});

gulp.task('minify-js', function () {

	return gulp.src(CONF.js.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(uglify())
		.pipe(concat(CONF.js.file))
		.pipe(gulp.dest(CONF.paths.tmp));

});

gulp.task('minify-html', function () {

	return gulp.src(CONF.html.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(htmlreplace({
			'css': CONF.css.file,
			'js': CONF.js.file,
			'svg': {
				src: gulp.src(CONF.paths.src + CONF.img.logo),
				tpl: '%s'
			}
		}))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		.pipe(gulp.dest(CONF.paths.tmp));

});

gulp.task('minify-json', function () {

	return gulp.src(CONF.json.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(jsonminify())
		.pipe(gulp.dest(CONF.paths.tmp));

});

gulp.task('minify-img', function () {

	return gulp.src(CONF.img.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(imagemin({
			verbose: true
		}))
		.pipe(gulp.dest(CONF.paths.tmp));

});

gulp.task('minify-all', gulp.series(gulp.parallel('minify-css', 'minify-js', 'minify-json', 'minify-img'), 'minify-html'));

gulp.task('move', function () {

	return gulp.src(CONF.move.files.map(function (file) {
			return CONF.paths.src + file
		}))
		.pipe(gulp.dest(CONF.paths.tmp));

});

gulp.task('clean', function () {

	return del([CONF.paths.tmp, CONF.paths.build]);

});

gulp.task('zip', function () {

	return gulp.src(CONF.paths.tmp + '**/**')
		.pipe(zip(CONF.zip.file))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('build', gulp.series('clean', gulp.parallel('move', 'minify-all'), 'zip'));

gulp.task('build_firefox', function () {

	gulp.src(CONF.paths.tmp + CONF.json.manifest)
		.pipe(jeditor(function (json) {
			delete json.version_name;
			return json;
		}))
		.pipe(jsonminify())
		.pipe(gulp.dest(CONF.paths.tmp));

		return gulp.src(CONF.paths.tmp + '**/**')
		.pipe(zip(CONF.zip.firefox))
		.pipe(gulp.dest(CONF.paths.build));

});

gulp.task('default', gulp.series('build', 'build_firefox'));