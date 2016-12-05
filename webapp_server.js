
/*
 * Event based WebSockets via Sockets.io with webserver for web app
 */

import fs from 'fs';

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

	// send photo urls to requesting client
	socket.on('get latest photos', function(){

		fs.readdir('./webapp/photos', function(err, files){
			files.sort();

			for (var i = 0; i < files.length; i++) {
				files[i] = 'photos/'+files[i];
			}

			io.to(socket.id).emit('new photos', files);
		});
	});

});



/*
 * Module exports for connection
 */
module.exports = {
    sendNewPhoto: function(imgUrlArray){
    	// send new image url to all
		io.emit('new photos', imgUrlArray);
	}
};