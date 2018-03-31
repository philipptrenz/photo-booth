//'use strict';
import 'util';

import $ from 'jquery';
import path from 'path';
import sharp from 'sharp';

import 'popper.js';
import 'bootstrap';

import config from './config.json';
import webApp from './webapp_server.js';

var utils = require('./utils.js').utils;

//import gphoto2 from 'gphoto2';
var gphoto2 = require('../node-gphoto2/build/Release/gphoto2')
var GPhoto = new gphoto2.GPhoto2();

initializeCamera();

var camera;
const timeoutAfterSeconds = 25; 
var keepImagesOnCamera = config.gphoto2.keep ? config.gphoto2.keep : false;


/*
 * Trigger photo when clicking / touching anywhere at the screen
 */
$( "body" ).click(function() {
  takePhoto();
});


/*
 * Detect and configure camera
 */
function initializeCamera() {

  GPhoto.list(function (list) {
    if (list.length === 0) {
      throwError('gphoto2: No camera found!');
      return;
    }
    camera = list[0];
    console.log('gphoto2: Found', camera.model);

    // Set configuration values
    const gphoto2_config = config.gphoto2;
    
    if (gphoto2_config.capturetarget) {
      camera.setConfigValue('capturetarget', gphoto2_config.capturetarget, function (err) {
        if (err){
          throwError(err);
        } else {
          console.log('gphoto2: capturetarget=',gphoto2_config.capturetarget);
        }
      });
    }

  });
}


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
if (config.init.useGPIO !== undefined ? config.init.useGPIO : true) {
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

function getErrorMessage() {
  var errorMessage = config.errorMessage !== undefined ? config.errorMessage : "Sorry, please try again ...";
  return '<span class="fadein">'+ errorMessage+'</span>';
}

// TODO: Adjust dynamically, depends on hardware!
// Idea: avg of time used for shoot and converting +5 seconds

var isTakingPhoto = false;
var counter;
function takePhoto() {
  // prevent two tasks at the same time!
  if (isTakingPhoto) return;
  if (camera === undefined) {
    return;
  }

  isTakingPhoto = true;
  var duration = 5;
  
  $("#countdown").fadeIn(250);
  $("#countdown").html('<span class="fadeout">'+duration+'</span>');

  counter = setInterval(function () {
      duration--;
      //console.log(duration);

      if (duration > 0) {
        $("#countdown").html('<span class="fadeout">'+duration+'</span>');
      }

      if (duration == 1) {
        takePhotoSaveShowAndHide();
      }

      if (duration == 0 && !$("#countdown").html().includes(getErrorMessage())) {
        $("#countdown").html('');
      }

      if (duration == -2) {
        if (!$("#countdown").html().includes(getErrorMessage())) {
          $("#countdown").html('<div class="loading"><i class="fa fa-circle-o-notch fa-spin fa-3x fa-fw"></i></div>');
        }
      }

      // out of time error
      if (duration == -timeoutAfterSeconds) {
        if (isTakingPhoto && (!$("#countdown").has("#preview") || !$("#countdown").html().includes(getErrorMessage()))) {
          throwError('No response in time, something went wrong');
        }
        clearInterval(counter);
      }
    }, 1000);
}

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

// ---------------------------------------------------- //

function takePhotoSaveShowAndHide(){

  const maxImageSize = config.maxImageSize ? config.maxImageSize : 1500;
  var filename = 'img_'+ utils.getTimestamp(new Date()) ;
  var filepath = utils.getPhotosDirectory()+'/'+filename+'.jpg';
  var webFilepath = utils.getPhotoWebDirectory()+filename+'.jpg';

  // Take picture with camera object obtained from list()
  camera.takePicture({ download: true, keep: keepImagesOnCamera }, function (err, data) {

    if (err) {
      throwError(err);
    } else {

      // resize image to given maxSize
      sharp(data)
        .resize(Number(maxImageSize)) // scale width to 1500
        .toFile(filepath, function(err) {

          if (err) {
            throwError(err);
          } else {
            console.timeEnd('photo taken, downloaded and converted');

            var preview = '<div id=\'preview\' style=\'background-image: url(\"'+filepath+'\");\'></div>';

            $("#countdown").html(preview);

            // send to every webapp
            webApp.sendNewPhoto([webFilepath]);  // TESTING

            // add image to collage
            utils.prependImage(filepath)

            // show picture for 5 seconds then hide
            hideCountdown(5);
          }
      });
    }

  });

}

// ---------------------------------------------------- //

var errorThrown = false;
function throwError(error) {
  if (!errorThrown) {
    errorThrown = true;
    $("#countdown").html(getErrorMessage());
    console.log('shooting error: ' + error);
    hideCountdown(3);
  }
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
      errorThrown = false;
      clearInterval(wait);
    }, 500);
    clearInterval(waiter);
  }, delay*1000);
}
