
/*
 * Event based WebSockets via Sockets.io with webserver for web app
 */

import fs from 'fs';
import config from './config.json';

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 80;

server.listen(port, function () {
	console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/webapp'));


// Connect event
io.on('connection', function(socket){

	socket.on('disconnect', function(){

	});

	// save mail address
	socket.on('mail address', function(msg){
		
		fs.appendFile('email-addresses.txt', msg+",\n", function (err) {
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

		fs.readdir('./webapp/photos', function(err, files){

			if (files) {
				files.sort();

				var images = [];
				for (var i = 0; i < files.length; i++) {
					if (!files[i].includes('large')){  // filter unconverted photos
						images.push('photos/'+files[i]);
					}
				}

				io.to(socket.id).emit('new photos', images);
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

				fs.writeFile('./config.json', JSON.stringify(json['config'], null, "\t"), function (err) {
					if (err) {
						console.log('updating config failed: '+err);
					} else {
						// force require('./config.json') to be reloaded
						delete require.cache[require.resolve('./config.json')];

						console.log('config updated: \n'+JSON.stringify(config, null, "\t"));
					}
				});
			}
			if (json['option']) {
				if (json['option'] == 'restart') {
					// reload electron
					var electron = require('electron');
				    var app = electron.remote.app;
					app.relaunch();
					app.exit();
				}else if (json['option'] == 'exit'){
					// close electron
					var electron = require('electron');
				    var app = electron.remote.app;
					app.exit();
				}
			}

		} else {
			console.log('password wrong');
		}

	});

});



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