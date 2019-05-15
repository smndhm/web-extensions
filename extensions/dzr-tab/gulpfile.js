'use strict';

var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var htmlreplace = require('gulp-html-replace');
var gulpSequence = require('gulp-sequence');
// var	del = require('del');
// var	jsonminify = require('gulp-jsonminify');
// var	imagemin = require('gulp-imagemin');
// var	zip = require('gulp-zip');

const CONF = {
	path: {
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
		file: 'js/script.min.css'
	},
	html: {
		files: [
			'index.html'
		]
	}
};

gulp.task('minify-css', function () {

	return gulp.src(CONF.css.files.map(function (file) {
			return CONF.path.src + file
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
		.pipe(gulp.dest(CONF.path.build));

});

gulp.task('minify-js', function () {

	return gulp.src(CONF.js.files.map(function (file) {
			return CONF.path.src + file
		}))
		.pipe(uglify())
		.pipe(concat(CONF.js.file))
		.pipe(gulp.dest(CONF.path.build));

});

gulp.task('minify-html', function () {

	return gulp.src(CONF.html.files.map(function (file) {
			return CONF.path.src + file
		}))
		.pipe(htmlreplace({
			'css': CONF.css.file,
			'js': CONF.js.file
		}))
		.pipe(htmlmin({
			collapseWhitespace: true,
			removeComments: true
		}))
		.pipe(gulp.dest(CONF.path.build));

});

gulp.task('minify-all', gulp.parallel('minify-css', 'minify-js', 'minify-html'));