import sharp from 'sharp';
import gphoto2 from 'gphoto2';

import config from './config.json';

class Camera {

	constructor() {

		this.GPhoto = new gphoto2.GPhoto2();

		// Negative value or undefined will disable logging, levels 0-4 enable it.
		this.GPhoto.setLogLevel(1);
		this.GPhoto.on('log', function (level, domain, message) {
		  console.log(domain, message);
		});

	}

	/*
	* Detect and configure camera
	*/
	initialize(callback) {
		var instance = this;
		this.GPhoto.list(function (list) {
			if (list.length === 0) {
				callback(false, 'camera not found', null);
				return;
			}
			instance.camera = list[0];

			console.log('gphoto2: Found', instance.camera.model);

			if (config.gphoto2.capturetarget) {
				instance.camera.setConfigValue('capturetarget', config.gphoto2.capturetarget, function (err) {
					if (err){
						callback(false, 'setting config failed', err);
					} else {
						callback(true);
					}
				});
			}

		});
	}

	

	isInitialized(){
		return (this.camera !== undefined);
	}

	isConnected(callback) {
		this.camera.getConfig(function (err, settings) {
			if (err) {
				callback(false, 'connection test failed', err);
			} else {
				callback(true);
			}
		});
	}

	takePicture(filepath, keep, callback) {

		if (this.camera === undefined) {
			callback(false, 'camera not initialized', null);
			return;
		}

		var instance = this;
		const maxImageSize = config.maxImageSize ? config.maxImageSize : 1500;

		this.camera.takePicture({ download: true, keep: keep }, function (err, data) {

			if (err) {
				if (err == -7) {
					callback(false, 'connecting to camera failed, PTP I/O Error', err);
				} else {
					callback(false, 'connecting to camera failed', err);
				}
				return;
			} 

			sharp(data) // resize image to given maxSize
				.resize(Number(maxImageSize)) // scale width to 1500
				.toFile(filepath, function(err) {
					
				if (err) {
					callback(false, 'resizing image failed', err)
				} else {
					callback(true);
				}
			});

		});

	}

}

/*
 * Module exports for connection
 */
export let camera = new Camera();