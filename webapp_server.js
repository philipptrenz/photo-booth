
/*
 * Event based WebSockets via Sockets.io with webserver for web app
 */

import fs from 'fs';
import config from './config.json';
import path from 'path';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

var remote = require('electron').remote; 

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
const currentDirectory = __dirname + '/webapp';
app.use(express.static(currentDirectory));

console.log("current directory: "+currentDirectory);

// Connect event
io.on('connection', function(socket){

	socket.on('disconnect', function(){

	});

	// save mail address
	socket.on('mail address', function(msg){

		var mycontentdir = getContentDirectory();
		
		fs.appendFile(mycontentdir+'/email-addresses.txt', msg+",\n", function (err) {
			if (err) {
				console.log('writing mail address to file failed: '+err);
			} else {
				console.log(msg+' successfully added to email-addresses.txt');
			}
		});
	});

	// send validation result back to this client
	socket.on('authenticate', function(password){
		io.to(socket.id).emit('authenticated', passwordIsValid(password));

	});


	// send photo urls to requesting client
	socket.on('get latest photos', function(){

		console.log("requested latest photos by webapp");

		fs.readdir(currentDirectory+'/photos', function(err, files){

			if (files) {
				files.sort();

				var images = [];
				for (var i = 0; i < files.length; i++) {
					if (!files[i].includes('large')){  // filter unconverted photos
						images.push('photos/'+files[i]);
					}
				}

				console.log("sending "+files.length+" latest photos to webapp");

				io.to(socket.id).emit('new photos', images);
			} else {
				console.log("no files to get sent, something went wrong! files="+files);
			}			
		});
	});

	// send validation result back to this client
	socket.on('get_config', function(password){

		if (passwordIsValid(password)) {
			/*configHelper.get(function(config) {
				io.to(socket.id).emit('get_config', config);
			});*/
			io.to(socket.id).emit('get_config', require('./config.json'));
		} else {
			io.to(socket.id).emit('get_config', false);
		}

	});

	socket.on('set_config', function(json){

		if (passwordIsValid(json['password'])) {

			if (json['config']) {

				fs.writeFile(__dirname+'/config.json', JSON.stringify(json['config'], null, "\t"), function (err) {
					if (err) {
						console.log('updating config failed: '+err);
					} else {
						// force require('./config.json') to be reloaded
						delete require.cache[require.resolve(__dirname+'/config.json')];

						console.log('config updated: \n'+JSON.stringify(config, null, "\t"));
					}
				});

				const newDevToolState = json['config'].init.showDevTools;
				const oldDevToolState = config.init.showDevTools;
				if (newDevToolState != undefined) {
					/*
					console.log("send ipcRenderer message");
					var ipcRenderer = require('electron').ipcRenderer;     
     				ipcRenderer.send('toggle-devTools');*/
					// toggleDevTools()
					//mainWindow.webcontents.openDevTools();

					if (newDevToolState) {
						remote.getGlobal('sharedObj').mainWindow.openDevTools();
					} else {
						remote.getGlobal('sharedObj').mainWindow.closeDevTools();
					}

				}
			}
			if (json['option']) {
				if (json['option'] == 'reboot') {
					// reload electron

					var exec = require('child_process').exec;
					exec("reboot", function (error, stdout, stderr) {
						console.log(stdout);
					});


				} else if (json['option'] == 'exit'){
					// close electron
					var electron = require('electron');
				    var app = electron.remote.app;
					app.exit();
				} else if (json['option'] == 'git-pull'){

					console.log("pulling from git repo");
					var exec = require('child_process').exec;
					exec("cd "+__dirname+" && git pull", function (error, stdout, stderr) {
						console.log("execute 'git pull', stdout: "+stdout);
					});
				}
			}

		} else {
			console.log('password wrong');
		}

	});

});

var getContentDirectoryInitialized = false;
var contentDirectory;
function getContentDirectory() {
  if (!getContentDirectoryInitialized) {
    var content_dir = path.resolve(__dirname, './content/');
    try {
      if (!fs.existsSync(config.content_dir)) fs.mkdirSync(config.content_dir);
      content_dir = config.content_dir;
      if(!content_dir.endsWith("/")) content_dir = content_dir + "/";
      getContentDirectoryInitialized = true;
      contentDirectory = content_dir
      getPhotosDirectory();
    } catch (err) {
        console.log('Could not open or create content_dir \''+config.content_dir+'\' like defined in config.json. '+err+'\nInstead going to use default \'./content\'');
        getContentDirectoryInitialized = true;
        contentDirectory = content_dir
        if (!fs.existsSync(content_dir)) fs.mkdirSync(content_dir);
        getPhotosDirectory();
    }
  }
  return contentDirectory;
}

function passwordIsValid(password) {
	if (config && config.webapp.password) {
		return (password && password == config.webapp.password);
	}
	console.log('getting password from config.json failed');
	return false;
}

/*
 * Module exports for connection
 */
module.exports = {
    sendNewPhoto: function(imgUrlArray){
    	// send new image url to all
		io.emit('new photos', imgUrlArray);
	}
};