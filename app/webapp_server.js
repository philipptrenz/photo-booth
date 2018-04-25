/* 
 * This file is part of "photo-booth" 
 * Copyright (c) 2018 Philipp Trenz
 *
 * For more information on the project go to
 * <https://github.com/philipptrenz/photo-booth>
 * 
 * This program is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU General Public License as published by  
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License 
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import fs from 'fs';
import path from 'path';

import booth from './booth.js';
import utils from "./utils.js";



var port = 80;

process.on('uncaughtException', function(err) {
    if (err.errno === 'EACCES') {
		console.warn('webapp: photo-booth must be run as root to use port 80. '
		+ 'Basically, it\'s not a good idea to run a web server as root, '
		+ 'consider setting up a redirect from port 80 to 8080 on your system');
		port = 8080;
		server.listen(port);
    } else
		console.error(err);
}); 



// server stuff
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var remote = require('electron').remote; 

server.listen(port, function () {
	console.log('webapp: listening at port %d', port);
});

// Routing
const currentDirectory = path.join(__dirname, '../', 'webapp');
app.use(express.static(currentDirectory));

// Connect event
io.on('connection', function(socket){

	if (utils.getConfig().init.grayscaleMode) {
		io.to(socket.id).emit('use grayscale');
	}

	if (utils.getConfig().webapp.enableRemoteRelease) {
		io.to(socket.id).emit('enable remote release');
	}

	socket.on('disconnect', function(){

	});

	// save mail address
	socket.on('mail address', function(msg){

		var mycontentdir = utils.getContentDirectory();
		
		fs.appendFile(mycontentdir+'/email-addresses.txt', msg+",\n", function (err) {
			if (err) {
				console.log('webapp: writing mail address to file failed: '+err);
			} else {
				console.log('webapp:', '\''+msg+'\'', 'added to email-addresses.txt');
			}
		});
	});

	// send validation result back to this client
	socket.on('authenticate', function(password){
		io.to(socket.id).emit('authenticated', passwordIsValid(password));

	});


	// send photo urls to requesting client
	socket.on('get latest photos', function(){

		console.log("webapp: requested latest photos by webapp");

		fs.readdir(currentDirectory+'/photos', function(err, files){

			if (files) {
				files.sort();

				var images = [];
				for (var i = 0; i < files.length; i++) {
					var isJpeg = files[i].endsWith(".jpg") || files[i].endsWith(".jpeg") || files[i].endsWith(".JPG") || files[i].endsWith(".JPEG");
					if (!files[i].includes('large') && isJpeg){  // filter unconverted photos
						images.push('photos/'+files[i]);
					}
				}

				console.log("webapp: sending "+files.length+" latest photos to webapp");

				io.to(socket.id).emit('new photos', images);
			} else {
				console.log("webapp: no files to send");
			}			
		});
	});

	// send validation result back to this client
	socket.on('get_config', function(password){

		if (passwordIsValid(password)) {
			io.to(socket.id).emit('get_config', utils.getConfig() );
		} else {
			io.to(socket.id).emit('get_config', false);
		}

	});

	socket.on('set_config', function(json){

		if (passwordIsValid(json['password'])) {

			utils.saveConfig(json['config'], function (res) {
				if (res) {
					const newDevToolState = json['config'].init.showDevTools;
					const oldDevToolState = utils.getConfig().init.showDevTools;
					if (newDevToolState != undefined) {

						if (newDevToolState) {
							remote.getGlobal('sharedObj').mainWindow.openDevTools();
						} else {
							remote.getGlobal('sharedObj').mainWindow.closeDevTools();
						}

					}
				} 
			});

			if (json['option']) {

				if (json['option'] == 'shutdown'){
					var exec = require('child_process').exec;
					exec("shutdown now", function (error, stdout, stderr) {
						console.log('webapp: ', stdout);
					});

				} else if (json['option'] == 'reboot') {
					// reload electron

					var exec = require('child_process').exec;
					exec("reboot", function (error, stdout, stderr) {
						console.log('webapp: ', stdout);
					});

				} else if (json['option'] == 'exit'){
					// close electron
					var electron = require('electron');
				    var app = electron.remote.app;
					app.exit();
				} else if (json['option'] == 'git-pull'){

					console.log("webapp: pulling from git repo");
					var exec = require('child_process').exec;
					exec("cd "+__dirname+" && git pull", function (error, stdout, stderr) {
						console.log("webapp: execute 'git pull', stdout: "+stdout);
					});
				}
			}

		} else {
			console.log('webapp: password wrong');
		}

	});


	socket.on('get_download_image', function(path, grayscale){

		var filename = path.substr(path.indexOf("/")+1);
		utils.convertImageForDownload(filename, grayscale, function(res, path, err) {
			if (res) {
				io.to(socket.id).emit('get_download_image', path);
			}
		});
	});

	socket.on('trigger_photo', function(password){
		if (utils.getConfig().webapp.enableRemoteRelease || passwordIsValid(password)) {
			booth.triggerPhoto();
		}
	});

});

function passwordIsValid(password) {
	if (utils.getConfig() && utils.getConfig().webapp.password) {
		return (password && password == utils.getConfig().webapp.password);
	}
	console.log('webapp: getting password from config.json failed');
	return false;
}

/*
 * Module exports for connection
 */
module.exports = {
    sendNewPhoto: function(webFilePath){
    	// send new image url to all
		io.emit('new photos', [webFilePath]);
	}
};