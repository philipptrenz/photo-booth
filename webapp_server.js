
/*
 * Event based WebSockets via Sockets.io with webserver for web app
 */

import fs from 'fs';
//import config from './config.json';

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

			fs.writeFile('./config.json', JSON.stringify(json['config'], null, "\t"), function (err) {
				if (err) {
					console.log('updating config failed: '+err);
				} else {
					delete require.cache[require.resolve('./config.json')];

					if (json['restart']) {
						// reload electron
						var electron = require('electron');
					    // Module to control application life.
					    var app = electron.remote.app;
						app.relaunch();
						app.exit();
					}
					//require.cache = {};
					console.log('config updated: \n'+JSON.stringify(config, null, "\t"));
				}
			});

			

		} else {
			console.log('password wrong');
		}

	});

});



function passwordIsValid(password) {
	console.log('validation of password not yet implemented');
	return (password && password == 'test');
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