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


import $ from 'jquery';
import Velocity from 'velocity-animate';
import slideshow from "./slideshow.js";

class Prompt {

	/*
	 * If duration < 0: No timeout
	 */
	constructor(html, duration) {
		this.active = false;
		this.activated = true;
		this.duration = duration;
		this.container = $("#prompt");
		this.html = html;
	}

	start(stay=false, instant=false, callback) {
		slideshow.stop(); // stop slideshow if running
		var self = this;
		if (self.activated && !self.active) {
			self.active = true;
			$(self.container).html(self.html);
			Velocity($(self.container), "fadeIn", { duration: 250 })
			
			if (self.duration >= 0 ) {
				self.timeout = setTimeout(function(){ 
					self.stop(stay, instant, callback);
				}, self.duration*1000);
			}
			return this;
		} else {
			return null;
		}
	}


	stop(stay=false, instant=false, callback) {
		var self = this;
		self.activated = false;	// prevent from starting after stop() was called
		if (self.active) {
			clearTimeout(self.timeout);

			if (stay) {
				$(self.container).html('');
				self.active = false;
				if (callback !== undefined) callback();
			} else {
				var fadeOutTime = instant ? 0 : 250;
				Velocity($(self.container), "fadeOut", { 
					duration: fadeOutTime,	
					complete : function() {
							$(self.container).html('');
							self.active = false;
							if (callback !== undefined) callback();
						}
				}
			)
			
				
			}

		} else {
			if (callback !== undefined) callback();
		}
	}

}

class SpinnerPrompt extends Prompt {

	constructor() {
		super('<div class="loading"><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i></div>', -1);
	}

}

class PreviewPrompt extends Prompt {

	constructor(filepath, duration) {
		super(`<div id='preview' style='background-image: url("${filepath}");'>
		<div class='progress-container'>
			<div style='z-index: 11000;' class="progress progress-striped active">
				<div class="progress-bar bg-info" style="width: 100%" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
				</div>
			</div>
		</div>
		</div>
		`, duration);
		this.initialDuration = duration;
	}

	start(stay=false, instant=false, callback) {
		const self = this;
		self.interval = setInterval(function() {
			if (self.duration > 0) {
				self.duration--;
				const progress = 100 * self.duration / self.initialDuration;
				$('.progress-bar').css('width', progress +'%').attr('aria-valuenow', progress);    
				
			} else {
				clearInterval(self.interval);
				self.stop(stay, instant, callback);
			}
		}, 1000);
		super.start(stay, instant, callback);
	}

	stop(stay=false, instant=false, callback) {
		var self = this;
		if (self.active) {
			clearInterval(self.interval);
			$('.progress-bar').css('width', '100%').attr('aria-valuenow', '100');    
		
		}
		super.stop(stay, instant, callback);
	}

}

class CameraErrorPrompt extends Prompt {

	constructor(duration) {
		super('<div class="error"><i class="fa fa-camera" aria-hidden="true"></i>  Whoops ...<br /><p>Something went wrong, please check the camera and try again</p></div>', duration);
	}
}

class CameraErrorOnStartupPrompt extends Prompt {

	constructor(duration) {
		super('<div class="error"><i class="fa fa-camera" aria-hidden="true"></i>  Oh no ...<br /><p>No camera found. Please check the connection and test by triggering a photo</p></div>', duration);
	}
}

class SharpErrorPrompt extends Prompt {

	constructor(duration) {
		super('<div class="error"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i>  Whoops ...<br /><p>Something went wrong when saving the photo, please try again</p></div>', duration);
	}
}


class CountdownPrompt {

	constructor(duration) {
		this.active = false;
		this.activated = true;
		this.duration = duration;
		this.container = $("#prompt");

		this.htmlPre = '<div class=\'countdown-container\'><div class=\'countdown-row\'><span id="countdown"><div style="font-size: 0.2em; margin-top: 120px">Bitte lächeln in... </div>';
		this.htmlPost = '</span></div></div>';
	}

	start(stay=false, instant=false, callback) {
		slideshow.stop();
		var self = this;
		if (self.activated && !self.active) {
			self.active = true;
			

			// first time run immediatly	
			self.html = self.htmlPre + self.duration + self.htmlPost;
			$(self.container).html(self.html);
			Velocity($(self.container), "fadeIn", { duration: 50 })
			Velocity($(self.container).children(), "fadeOut", { duration: 900 })
			self.duration--;

			self.interval = setInterval(function() {
				if (self.duration > 0) {
					self.html = self.htmlPre + self.duration + self.htmlPost;
					$(self.container).html(self.html);
					Velocity($(self.container).children(), "fadeOut", { duration: 900 })
					self.duration--;
				} else {
					clearInterval(self.interval);
					self.stop(stay, instant, callback);
				}
			}, 1000);
			return this;
		} else {
			return null;
		}
		
	}

	stop(stay=false, instant=false, callback) {
		var self = this;
		this.activated = false;	// prevent from starting after stop() was called
		if (self.active) {
			clearInterval(self.interval);
			if (stay) {
				$(self.container).html('');
				self.active = false;
				if (callback !== undefined) callback();
			} else {
				var fadeOutTime = instant ? 0 : 250;

				Velocity($(self.container), "fadeOut", { 
					duration: fadeOutTime,	
					complete : function() {
						$(self.container).html('');
						self.active = false;
						if (callback !== undefined) callback();
						}
				});
			}

		} else {
			if (callback !== undefined) callback();
		}
	}


}

/*
 * Module exports for connection
 */
export { Prompt as default, SpinnerPrompt, CountdownPrompt, PreviewPrompt, CameraErrorPrompt, CameraErrorOnStartupPrompt, SharpErrorPrompt };