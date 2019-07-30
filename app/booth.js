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

import 'popper.js';
import 'bootstrap';

import utils from "./utils.js";
import camera from "./camera.js";
import LivePreview from "./live-preview.js";
import {
  SpinnerPrompt,
  CountdownPrompt,
  PreviewPrompt,
  CameraErrorPrompt,
  CameraErrorOnStartupPrompt,
  SharpErrorPrompt
} from "./prompt.js";
import slideshow from "./slideshow.js";

import webApp from './webapp_server.js';

const {getCurrentWindow, globalShortcut} = require('electron').remote;

let livePreview;

camera.initialize(function( res, msg, err) {
  if (!res) {
    console.error('camera:', msg, err);
    new CameraErrorOnStartupPrompt(-1).start(false, false);
  }
  let liveConfig = utils.getConfig().live;
  if(liveConfig){
    livePreview = new LivePreview(camera.camera, document.getElementById('live'), liveConfig.framerate);
    livePreview.start()
  }
});

/*
 * Trigger photo when clicking / touching anywhere at the screen
 */
if (!utils.getConfig().triggers ||
    utils.getConfig().triggers.onClick ) {
    $("body").click(function () {
        trigger();
    });
}

/*
 * Custom User-definable Keyboard Triggers
 */
if( utils.getConfig().triggers &&
    utils.getConfig().triggers.customKeys &&
    utils.getConfig().triggers.customKeys.length > 0 ) {
    $( "body" ).keydown(function(e) {
        if( utils.getConfig().triggers.customKeys.indexOf( e.key ) !== -1 ) {
            trigger();
        }
    });
}

/* Listen for pushbutton on GPIO 3 (PIN 5)
 * Activate the use of GPIOs by setting useGPIO in config.json to true.
 */
if (utils.getConfig().init.useGPIO !== undefined ? utils.getConfig().init.useGPIO : true) {
  console.log('GPIO usage activated');
  const gpio = require('rpi-gpio');
  gpio.setMode(gpio.MODE_BCM);
  gpio.setup(3, gpio.DIR_IN, gpio.EDGE_BOTH);
  gpio.on('change', function(channel, value) {
    if (channel === 3 && !value) trigger();
    // NOTE: takePhoto() is secure to don't run twice
    // at the same time, make sure this is also so for
    // your code.
  });
}

const firstPhotoCountdownLength = utils.getConfig().firstPhotoCountdownLength ? Number(utils.getConfig().firstPhotoCountdownLength) : 5;
const followingPhotosCountdownLength = utils.getConfig().followingPhotosCountdownLength ? Number(utils.getConfig().followingPhotosCountdownLength) : 3;
const photoPreviewDuration = utils.getConfig().photoPreviewDuration ? Number(utils.getConfig().photoPreviewDuration) : 8;
const photoSeriesLength = utils.getConfig().photoSeriesLength ? Number(utils.getConfig().photoSeriesLength) : 3;

let executing = false;
let seriesCounter = 0;

function trigger() {

  if (executing) return;

  executing = true;

  slideshow.stop();

  if (camera.isInitialized()) {

    const triggerPhotoOffsetBeforeZero = 0.5; // in seconds

    // start countdown and show spinner afterwards
    let countdownLength;
    if(seriesCounter === 0) {
      countdownLength = firstPhotoCountdownLength;
    } else {
      countdownLength = followingPhotosCountdownLength;
    }
    let prompt = new CountdownPrompt(countdownLength).start( true, false, function() {
      prompt = new SpinnerPrompt();
      // wait a sec for spinner to start
      setTimeout(function() {
        prompt.start(true, false);
      }, 1500);
    });

    // take picture after countdown
    setTimeout(function() {
      if(livePreview)
        livePreview.stop();
      if (utils.getConfig().flash !== undefined && utils.getConfig().flash.enabled) {
        const flash = $("#flash");
        flash.addClass("flash");
        setTimeout(function () {
          flash.removeClass("flash");
        }, 750);
      }
      camera.takePicture(function(res, msg1, msg2) {

        const message1 = msg1;
        const message2 = msg2;

        prompt.stop(true, false, function() { // stop spinner if image is ready

            if (res === 0) {
              // after that show preview
              prompt = new PreviewPrompt(message1, photoPreviewDuration).start(false, false, function() {
                // end photo task after preview ended
                executing = false;
                if (++seriesCounter < photoSeriesLength) {
                  trigger();
                } else {
                  seriesCounter = 0;
                }
              });

              // Only add last image from series to collage
              if(seriesCounter === photoSeriesLength-1) {
                setTimeout(function () {
                  utils.prependImage(message1);     // add image to collage
                }, 1500);
              }

              webApp.sendNewPhoto(message2);  // send image to connected web clients

              if(livePreview)
                livePreview.start()
              slideshow.start();

            } else {

              console.error(message1, '\n', message2);

              if (res === -1 ) {  // camera not initialized
                new CameraErrorPrompt(5).start(false, false, function() { executing = false; });
              } else if (res == -2) { // gphoto2 error
                new CameraErrorPrompt(5).start(false, false, function() {
                  executing = false;
                  getCurrentWindow().reload();
                });
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

/*
 * Module exports
 */
module.exports.triggerPhoto = trigger;
