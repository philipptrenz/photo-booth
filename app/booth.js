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

//'use strict';
import 'util';

import $ from 'jquery';
import sharp from 'sharp';

import 'popper.js';
import 'bootstrap';

import utils from "./utils.js";
import camera from "./camera.js";
import { 
  SpinnerPrompt, 
  CountdownPrompt, 
  PreviewPrompt, 
  CameraErrorPrompt, 
  CameraErrorOnStartupPrompt, 
  SharpErrorPrompt
} from "./prompt.js";

import webApp from './webapp_server.js';

camera.initialize(function( res, msg, err) {
  if (!res) {
    console.error('camera:', msg, err);

    // TODO: handle error
    new CameraErrorOnStartupPrompt(-1).start(false, false);

  }
});

/*
 * Trigger photo when clicking / touching anywhere at the screen
 */
$( "body" ).click(function() {
  trigger();
});


/* Listen for pushbutton on GPIO 3 (PIN 5)
 * Activate the use of GPIOs by setting useGPIO in config.json to true.
 */
if (utils.getConfig().init.useGPIO !== undefined ? utils.getConfig().init.useGPIO : true) {
  console.log('GPIO usage activated');
  var gpio = require('rpi-gpio');
  gpio.setMode(gpio.MODE_BCM);
  gpio.setup(3, gpio.DIR_IN, gpio.EDGE_BOTH);
  gpio.on('change', function(channel, value) {
    if (channel == 3 && !value) trigger();
    // NOTE: takePhoto() is secure to don't run twice 
    // at the same time, make sure this is also so for
    // your code.
  });
}

var executing = false;
function trigger() {

  if (executing) return;

  executing = true;

  if (camera.isInitialized()) {

    

    var countdownLength = 5; // in seconds
    var triggerPhotoOffsetBeforeZero = 0.5; // in seconds

    // start countdown and show spinner afterwards
    var prompt = new CountdownPrompt(countdownLength).start( true, false, function() {
      prompt = new SpinnerPrompt();
      // wait a sec for spinner to start
      setTimeout(function() {
        prompt.start(true, false);
      }, 1500);
    });

    // take picture after countdown
    setTimeout(function() {

      var filepath = utils.getPhotosDirectory() + "img_" + utils.getTimestamp() + ".jpg";
      console.log(filepath);

      camera.takePicture(filepath, keepImagesOnCamera, function(res, msg, err) {

        prompt.stop(true, false, function() { // stop spinner if image is ready

            if (res == 0) {
              // after that show preview
              prompt = new PreviewPrompt(filepath, 8).start(false, false, function() {
                // end photo task after preview ended
                executing = false;
              });

              utils.prependImage(filepath);     // add image to collage
              webApp.sendNewPhoto([filename]);  // send image to connected web clients

            } else {

              console.error(mgs, '\n', err);

              if (res == -1 ) {  // camera not initialized
                new CameraErrorPrompt(5).start(false, false, function() { executing = false; });
              } else if (res == -2) { // gphoto2 error
                new CameraErrorPrompt(5).start(false, false, function() { executing = false; });
              } else if (res == -3) { // sharp error
                 new SharpErrorPrompt(5).start(false, false, function() { executing = false; });
              }
            }

        });

      });

    }, (countdownLength-triggerPhotoOffsetBeforeZero)*1000);

  } else {

    // TODO: Handle uninitialized camera

    camera.initialize(function( res, msg, err) {
      if (res) {

        executing = false;
        trigger();

      } else {

        // TODO: handle error
        new CameraErrorPrompt(5).start(false, false, function() {
          executing = false;
        })

      }

    });

  }
  
}