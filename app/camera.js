/* 
 * This file is part of "photo booth" 
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

import sharp from 'sharp';
import gphoto2 from 'gphoto2';

import { utils } from "./utils.js";

class Camera {

	constructor() {

		this.GPhoto = new gphoto2.GPhoto2();

		// Negative value or undefined will disable logging, levels 0-4 enable it.
		this.GPhoto.setLogLevel(-1);
	}

	/*
	* Detect and configure camera
	*/
	initialize(callback) {
		var self = this;
		this.GPhoto.list(function (list) {
			if (list.length === 0) {
				callback(false, 'camera not found', null);
				return;
			}
			self.camera = list[0];

			console.log('gphoto2: Found', self.camera.model);

			if (utils.getConfig().gphoto2.capturetarget) {
				self.camera.setConfigValue('capturetarget', utils.getConfig().gphoto2.capturetarget, function (err) {
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

		var self = this;
		const maxImageSize = utils.getConfig().maxImageSize ? utils.getConfig().maxImageSize : 1500;

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