//'use strict';
import 'util';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

var config = require('./config.json');

checkGrayscaleMode();
getContentDirectory();
initializeBranding();
loadRecentImagesAfterStart();
printIpAddresses();


import $ from 'jquery';
import webApp from './webapp_server.js';

const timeoutAfterSeconds = 25; 

$( "body" ).click(function() {
  takePhoto();
});


// ---------------------------------------------------- //

 /*
 * Every downloaded image from your camera gets resized and stored,
 * so the files aren't giant and can be displayed properly.
 * You can defin the pixel width by "maxImageSize" in config.json
 *
 * Default maximal size is 1500, should be okay to display images in 
 * fullscreen when having a resolution not higher than 1920x1080 px
 * on your monitor.
 *
 * ----
 *
 * If you want to store all images in full size also on sd card of your camera,
 * set "keepImagesOnCamera" under gphoto2 in config.json to true. 
 *
 * Also it is important to choose the right storage on your camera, which is done
 * via the "captureTarget" property of gphoto2. E.g. if internal RAM is chosen, the image
 * will get deleted when you turn off your camera. Because it depends on your camera, I 
 * can't give you here the right choice for your setup.
 *
 * To look for the right options, run the following command in your terminal with your camera connected:
 *    gphoto2 --get-config=capturetarget
 */
function getCmd(filepath) {
  const gphoto2 = config.gphoto2;

  const captureTarget = gphoto2.captureTarget ? gphoto2.captureTarget: 0;
  const keepImages = (gphoto2.keepImagesOnCamera ? gphoto2.keepImagesOnCamera : true) ? '--keep ': '--no-keep';
  const port = '--port '+(gphoto2.port ? gphoto2.port.trim() : "usb")+' ';
  const optParam = (gphoto2.optionalParameter) ? gphoto2.optionalParameter.trim()+' ' : '';
  const path = filepath ? filepath : "tmp.jpg";

  const cmd = "gphoto2 --set-config capturetarget="+captureTarget+" --capture-image-and-download "+keepImages+port+optParam+"--filename "+path;
  console.log('running shell command:\n'+cmd);
  return cmd;
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

// ---------------------------------------------------- //

var getContentDirectoryInitialized = false;
var contentDirectory;
function getContentDirectory() {
  if (!getContentDirectoryInitialized) {
    var content_dir = path.resolve(__dirname, './content/');
    try {
      if (!fs.existsSync(config.content_dir)) fs.mkdirSync(config.content_dir);
      content_dir = config.content_dir;
      if(!content_dir.endsWith("/")) content_dir = content_dir + "/";
      getContentDirectoryInitialized = true;
      contentDirectory = content_dir
      getPhotosDirectory();
    } catch (err) {
        console.log('Could not open or create content_dir \''+config.content_dir+'\' like defined in config.json. '+err+'\nInstead going to use default \'./content\'');
        getContentDirectoryInitialized = true;
        contentDirectory = content_dir
        if (!fs.existsSync(content_dir)) fs.mkdirSync(content_dir);
        getPhotosDirectory();
    }
  }
  return contentDirectory;
}

var getPhotosDirectoryInitialized = false;
var photoDirectory;
function getPhotosDirectory() {
  if (!getPhotosDirectoryInitialized) {
    const web_dir = path.resolve(getContentDirectory(), "./web/");
    if (!fs.existsSync(web_dir)) fs.mkdirSync(web_dir);
    photoDirectory = web_dir
    getPhotosDirectoryInitialized = true;
    getPhotoWebDirectory()
    return web_dir;
  }
  return photoDirectory;
}

var getPhotoWebDirectoryInitialized = false;
function getPhotoWebDirectory() {

  if (!getPhotoWebDirectoryInitialized) {
    const web_dir = path.resolve(__dirname, "./webapp/photos/");
    if (fs.existsSync(web_dir)) fs.unlinkSync(web_dir);
    fs.symlinkSync(getPhotosDirectory(), web_dir);
    getPhotoWebDirectoryInitialized = true;
  }
  
  return 'photos/';
}

// ---------------------------------------------------- //


// TODO: Adjust dynamically, depends on hardware!
// Idea: avg of time used for shoot and converting +5 seconds

var isTakingPhoto = false;
var counter;
function takePhoto() {
  // prevent two tasks at the same time!
  if (isTakingPhoto) return;

  config = require('./config.json');

  isCameraConnected(function(cameraFound) {
    if (cameraFound == false) {
      if (isTakingPhoto && (!$("#countdown").has("#preview") || !$("#countdown").html().includes(getErrorMessage()))) {
        throwError('No camera found!');
      }
      clearInterval(counter);
      isTakingPhoto = false;
    }
  });

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

function isCameraConnected(callback) {

  var exec = require('child_process').exec;
  exec("gphoto2 --auto-detect", function (error, stdout, stderr) {
    if (error) {
      throwError(error);
    }


    /* output is e.g.:
      
      Model                          Port                                            
      ----------------------------------------------------------
      Nikon DSC D5300                usb:020,010     

    */

    if (!stdout) callback(false);
    var lines = stdout.split("\n"); 
    lines = cleanArray(lines);

    if (lines.length > 2) {
      for (var i = 2; i < lines.length; i++) {
        var camera = lines[i].substr(0, lines[i].indexOf("   "));
        console.log("found camera: "+camera);
      }
      callback(true);
    } else {
      callback(false);
    }
  });

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
  var exec = require('child_process').exec;

  const dir = getPhotosDirectory();

  const maxImageSize = config.maxImageSize ? config.maxImageSize : 1500;
  var filename = 'img_'+getTimestamp(new Date());
  var fileextension = '.jpg';
  var inputFilepath = dir+'/'+filename+'_large'+fileextension;
  var filepath = dir+'/'+filename+fileextension;
  var webFilepath = getPhotoWebDirectory()+filename+fileextension;
  //console.log("web file path: "+webFilepath);
  
  console.time('photo taken, downloaded and converted');

  // execute gphoto2 command line program
  exec(getCmd(inputFilepath), function (error, stdout, stderr) {
    if (error) throwError(error);
  });

  // create file watcher to wait for image to be downloaded
  var watcher = fs.watch(dir, (eventType, filename) => {
    
    // as soon as the image is there
    if (filename){
      // resize image to given maxSize
      sharp(inputFilepath)
        .resize(Number(maxImageSize)) // scale width to 1500
        .toFile(filepath, function(err) {

          fs.unlink(inputFilepath,function(err){
            if(err) {
              throwError(err);
              return console.log(err);
            }
          });  

          if (err) {
            throwError(err);
          } else {
            console.timeEnd('photo taken, downloaded and converted');

            var preview = '<div id=\'preview\' style=\'background-image: url(\"'+filepath+'\");\'></div>';

            $("#countdown").html(preview);

            // send to every webapp
            webApp.sendNewPhoto([webFilepath]);  // TESTING

            // add image to collage
            var img = $('<img>');
            img.attr('src', filepath);
            $("#collage").prepend(img);

            scaleCollageImages();

            // show picture for 5 seconds then hide
            hideCountdown(5);
          }
      });
    }
    watcher.close();

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

function loadRecentImagesAfterStart() {

  var photos_dir = getPhotosDirectory();

  fs.readdir(photos_dir, function(err, files){
    if (files) {
      files.sort();

      for (var i = 0; i < files.length; i++) {
        //console.log(photos_dir+"/"+files[i]);
        var isImage =  files[i].endsWith(".jpg") || files[i].endsWith(".jpeg") || files[i].endsWith(".JPG") || files[i].endsWith(".JPEG");

        if ( isImage && !files[i].includes('large')){  // filter unconverted photos
          // add image to collage
          var img = $('<img>');
          img.attr('src', getPhotosDirectory()+"/"+files[i]);
          $("#collage").prepend(img);
        }
      }
      scaleCollageImages();
    }
  });
}

// ---------------------------------------------------- //

$( window ).resize(function() {
  scaleCollageImages();
});

// ---------------------------------------------------- //

function initializeBranding() {
  if (config.branding) {

    var type = config.branding.type
    if (type) {
      if (type == 'text') {
        $('#front').html(config.branding.content);
      } else if (type == 'image') {
        $('#front').html("Not yet implemented");
      }
    }
    

    var position = config.branding.position
    if (position) {
      if (position == 'center') {
        $('#front').css('align-items','center');
        $('#front').css('justify-content','center');
      } else if (position == 'topleft') {
        $('#front').css('align-items','flex-start');
        $('#front').css('justify-content','flex-start');
      } else if (position == 'topright') {
        $('#front').css('align-items','flex-start');
        $('#front').css('justify-content','flex-end');
      } else if (position == 'bottomleft') {
        $('#front').css('align-items','flex-end');
        $('#front').css('justify-content','flex-start');
      } else if (position == 'bottomright') {
        $('#front').css('align-items','flex-end');
        $('#front').css('justify-content','flex-end');
      }
    }
  }
}

// ---------------------------------------------------- //

function scaleCollageImages() {
  var collageWidth = $("#collage").width();
  var imgPerRow = Math.round(collageWidth/300);              
  $("#collage > img").outerWidth(collageWidth/imgPerRow);

  while( $("#collage").children().length > 6*Math.pow(imgPerRow, 2)) {
     $("#collage").children().last().remove();
  }
}

// ---------------------------------------------------- //

function getTimestamp(now) {
  var secs = now.getSeconds() < 10 ? '0'+now.getSeconds() : now.getSeconds();
  var mins = now.getMinutes() < 10 ? '0'+now.getMinutes() : now.getMinutes();
  var hours = now.getHours() < 10 ? '0'+now.getHours() : now.getHours();
  var date = now.getDate() < 10 ? '0'+String(now.getDate()) : String(now.getDate());
  var month = (now.getMonth()+1) < 10 ? '0'+String(now.getMonth()+1) : String(now.getMonth()+1);
  var year = String(now.getFullYear());

  return year+month+date+'_'+hours+'-'+mins+'-'+secs;
}

function getDate(now) {
  return now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate();
}

function printIpAddresses() {
  var os = require('os');
  var ifaces = os.networkInterfaces();

  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log("ipaddress: "+ifname + ':' + alias, iface.address);
      } else {
        // this interface has only one ipv4 adress
        console.log("ipaddress: "+ifname, iface.address);
      }
      ++alias;
    });
  });
}

function checkGrayscaleMode() {
  if (config.init.grayscaleMode) {
    console.log("using grayscale mode");
    $('head').append('<link rel="stylesheet" type="text/css" href="css/grayscale.css">');
  }
}

