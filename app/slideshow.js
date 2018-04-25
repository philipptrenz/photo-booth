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

import utils from "./utils.js";


class Slideshow {

  constructor() {

    if (utils.getConfig().slideshow !== undefined && utils.getConfig().slideshow.enabled) {
      var params = utils.getConfig().slideshow;

      this.enabled = true;

      $('#collage').append("<div id='slideshow'>");

      this.delay = (typeof params.activatesAfterSeconds == 'number') ? params.activatesAfterSeconds : 30;
      this.duration = (typeof params.secondsPerImages == 'number') ? params.secondsPerImages : 8;
      if (this.duration < 4) this.duration = 4;


      console.log('slideshow: enabled');

      var self = this;
      $('body').mousemove(function() {
        self.stop();
        self.start();
      });
      
      this.start();

    } else {
      this.enabled = false;
    }
    
    
  }

  start() {
    var numImgs = $('#collage img').map(function() { return this.src; }).get().length;
    if (this.enabled && numImgs > 2) {
      var self = this;
      self.slideshowDelay = setTimeout(function() {
        self.slideshow = setInterval(function() {
          // get all image sources and choose one randomly
          var arr = $('#collage img').map(function() { return this.src; }).get();
          var idx = Math.floor(Math.random() * arr.length) 
          $('#slideshow').css('background-image', 'url("' + arr[idx] + '")');
          if ($('#slideshow:hidden')) $('#slideshow').fadeIn(3000);

        }, self.duration*1000);
      }, self.delay*1000);
    }
    
  }

  stop(callback) {
    if (this.enabled) {
      clearTimeout(this.slideshowDelay);
      clearInterval(this.slideshow);
      $('#slideshow').fadeOut(500, function() {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  }
}


/*
 * Module exports for connection
 */
let slideshow = new Slideshow() 
export { slideshow as default };