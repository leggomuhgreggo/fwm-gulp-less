'use strict';

var	gulp = require('gulp'),
	less = require('gulp-less'),
	cleanCSS = require('gulp-clean-css'),
	autoprefixer = require('gulp-autoprefixer'),
	watch = require('gulp-watch'),
	path = require('path'),
	ftp = require('vinyl-ftp'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),

	ftpconf = {
		'username': 'un',
		'password': 'pw',
		'testHost': '10.50.0.117',
		'devHost': '10.50.0.206',
		'port': '21',
		'remoteFolder': '/',
	},

	baseFolder = "../",
	testFolderName = 'FosterWeb',
	devFolderName = 'FosterWebDev',

	stylesPaths = [
		baseFolder + testFolderName + '/*/includes/default/*',
		baseFolder + testFolderName + '/*/includes/mobile/*',

		baseFolder + devFolderName + '/*/httpdocs/includes/default/*',
		baseFolder + devFolderName + '/*/httpdocs/includes/mobile/*',

		baseFolder + devFolderName + '/fosterwebmarketing.com/subdomains/*/includes/default/*',
	],

	onError = function(err) {notify(err)},

	getFtpConnection = function(getHost) {  
		return ftp.create({
			host: getHost,
			port: ftpconf.port,
			user: ftpconf.username,
			password: ftpconf.password,
			parallel: 5,
		});
	};

gulp.task('watch', function() {

	var lessPaths = stylesPaths.map(function(a){ return a + '.less'}),
		env, conn, relPath;

	watch(lessPaths, function (event) {

		if( event.path.indexOf(testFolderName) >= 0 && event.path.indexOf(devFolderName) < 0 ){
			conn = getFtpConnection(ftpconf.testHost);
			env = testFolderName;
		}else{
			conn = getFtpConnection(ftpconf.devHost);
			env = devFolderName;
		}

		relPath = event.dirname.split(env)[1];

		return gulp.src( (event.path) )
		//less
		.pipe( plumber({errorHandler: notify.onError({'message': 'Error: <%= error.message %>'})}) )
		.pipe( less() )
		.pipe( autoprefixer('last 20 versions', 'ie 8') )		//configure autoprefixer settings
		.pipe( cleanCSS({restructuring: false}) )	//process import was failing to load external css files, probably server security settings
		.pipe( gulp.dest(event.dirname) )
		.pipe( notify({message: "<%= options.filePath %> - Less Compiled, Prefixed and Minified"}) )

		//ftp
		.pipe( plumber({errorHandler: notify.onError({title: '', 'message': 'FTP Error: <%= error.message %>'})}) )
		.pipe( conn.newer( ftpconf.remoteFolder + relPath ) ) 
		.pipe( conn.dest( ftpconf.remoteFolder + relPath ) )
		.pipe( notify({title: '', message: "<%= options.filePath %> - Uploaded"}) )
	})

	.on('error', function() {return true;})

});