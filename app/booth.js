//'use strict';
import 'util';

import $ from 'jquery';
import sharp from 'sharp';

import 'popper.js';
import 'bootstrap';

import webApp from './webapp_server.js';

import { utils } from "./utils.js";
import { camera } from "./camera.js";

camera.initialize(function( res, msg, err) {
  if (!res) {
    console.error(msg, err);

    // TODO: handle error

  }
});

/*
 * Trigger photo when clicking / touching anywhere at the screen
 */
$( "body" ).click(function() {
  takePhoto();
});


/* Listen for pushbutton on GPIO 3 (PIN 5)
 * Activate the use of GPIOs by setting useGPIO in config.json to true.
 *
 * NOTE: To use GPIO's this application has to
 * run as root (sudo npm start)!
 *
 * For Raspberry Pi (B Rev2 / B+ / 2 / 3):
 * Connect the first port of the switchbutton to ground,
 * second to GPIO 3 (PIN 5) and to an resistor of about 10k-100kΩ,
 * the other end of the resistor to 3.3V (e.g. PIN 1)
 *
 * _______RASPBERRY PI_______
 *                          |
 *          |----3.3V---●o  |
 * ~50kΩ →  ▯           oo  |
 *          |----GPIO3--●o  |
 *      [-\             oo  |
 *         \------GND---●o  |
 *                      oo  |
 *                      oo  |
 *                      oo  |
 *                      oo  |
 *                      oo  |
 *                      oo  |
 *                      oo  |
 *                      oo  |
 *                          |
 *                          |
 */
if (utils.getConfig().init.useGPIO !== undefined ? utils.getConfig().init.useGPIO : true) {
  console.log('GPIO usage activated');
  var gpio = require('rpi-gpio');
  gpio.setMode(gpio.MODE_BCM);
  gpio.setup(3, gpio.DIR_IN, gpio.EDGE_BOTH);
  gpio.on('change', function(channel, value) {
    if (channel == 3 && !value) takePhoto();
    // NOTE: takePhoto() is secure to don't run twice 
    // at the same time, make sure this is also so for
    // your code.
  });
}

var isTakingPhoto = false;
var counter;
function takePhoto() {
  // prevent two tasks at the same time!
  if (isTakingPhoto) return;
  if (!camera.isInitialized()) {

    // TODO: notify user 
    console.error('gphoto2: camera not initialized');

    return;
  }

  isTakingPhoto = true;
  var duration = 5;
  
  $("#countdown").fadeIn(250);
  $("#countdown").html('<span class="fadeout">'+duration+'</span>');

  // event loop
  counter = setInterval(function () {
    duration--;

    if (duration > 0)  $("#countdown").html('<span class="fadeout">'+duration+'</span>');

    if (duration == 1) {

      var filename = 'img_'+ utils.getTimestamp(new Date())+'.jpg';
      var filepath = utils.getPhotosDirectory()+'/'+filename;
      var keepImagesOnCamera = utils.getConfig().gphoto2.keep ? utils.getConfig().gphoto2.keep : false;

      camera.takePicture(filepath, keepImagesOnCamera, function(res, msg, err) {
        if (res) {
          $("#countdown").html( '<div id=\'preview\' style=\'background-image: url(\"'+filepath+'\");\'></div>' );
          utils.prependImage(filepath)        // add image to collage
          webApp.sendNewPhoto([filename]); // send to web apps
          hideCountdown(5); // show picture for 5 seconds then hide
        } else {
            console.error(msg, err);

            // TODO: handle error
            hideCountdown(0);
        }
      });

    }

    if (duration == 0) $("#countdown").html('');

    if (duration == -2) {
      $("#countdown").html('<div class="loading"><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i></div>');
    }
  }, 1000);
}

function hideCountdown(delay) {
  clearInterval(counter);
  var waiter = setInterval(function() {
    $("#countdown").addClass("fadeout");
    var wait = setInterval(function() {
      $("#countdown").hide();
      $("#countdown").removeClass("fadeout");
      $("#countdown").html('');
      isTakingPhoto = false;
      clearInterval(wait);
    }, 500);
    clearInterval(waiter);
  }, delay*1000);
}
