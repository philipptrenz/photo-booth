import os from 'os';
import fs from 'fs';
import $ from 'jquery';
import path from 'path';

import config from './config.json';


// ---------------------------------------------------- //

class Utils {

  constructor() {
    this.getContentDirectoryInitialized = false;
    this.getPhotosDirectoryInitialized = false;
    this.getPhotoWebDirectoryInitialized = false;

    this.checkGrayscaleMode();
    this.getContentDirectory();
    this.initializeBranding();
    this.loadRecentImagesAfterStart();
    this.printIpAddresses();
  }

  getContentDirectory() {
    if (!this.getContentDirectoryInitialized) {
      var content_dir = path.resolve(__dirname, './content/');
      try {
        if (!fs.existsSync(config.content_dir)) fs.mkdirSync(config.content_dir);
        content_dir = config.content_dir;
        if(!content_dir.endsWith("/")) content_dir = content_dir + "/";
        this.getContentDirectoryInitialized = true;
        this.contentDirectory = content_dir
        this.getPhotosDirectory();
      } catch (err) {
          console.log('Could not open or create content_dir \''+config.content_dir+'\' like defined in config.json. '+err+'\nInstead going to use default \'./content\'');
          this.getContentDirectoryInitialized = true;
          this.contentDirectory = content_dir
          if (!fs.existsSync(content_dir)) fs.mkdirSync(content_dir);
          this.getPhotosDirectory();
      }
    }
    return this.contentDirectory;
  }

  getPhotosDirectory() {
    if (!this.getPhotosDirectoryInitialized) {
      const web_dir = path.resolve(this.getContentDirectory(), "./web/");
      if (!fs.existsSync(web_dir)) fs.mkdirSync(web_dir);
      self.photoDirectory = web_dir
      this.getPhotosDirectoryInitialized = true;
      this.getPhotoWebDirectory()
      return web_dir;
    }
    return self.photoDirectory;
  }

  getPhotoWebDirectory() {

    if (!this.getPhotoWebDirectoryInitialized) {
      const web_dir = path.resolve(__dirname, "./webapp/photos/");
      if (fs.existsSync(web_dir)) fs.unlinkSync(web_dir);
      fs.symlinkSync(this.getPhotosDirectory(), web_dir);
      this.getPhotoWebDirectoryInitialized = true;
    }
    
    return 'photos/';
  }

  // ---------------------------------------------------- //

  loadRecentImagesAfterStart() {

    var photos_dir = this.getPhotosDirectory();

    fs.readdir(photos_dir, function(err, files){
      var utils = require('./utils.js').utils;

      if (files) {
        files.sort();

        for (var i = 0; i < files.length; i++) {
          //console.log(photos_dir+"/"+files[i]);
          var isImage =  files[i].endsWith(".jpg") || files[i].endsWith(".jpeg") || files[i].endsWith(".JPG") || files[i].endsWith(".JPEG");

          if ( isImage && !files[i].includes('large')){  // filter unconverted photos
            // add image to collage
            utils.prependImage(utils.getPhotosDirectory()+"/"+files[i]);
          }
        }
      }
    });
  }

  prependImage(path) {
    var img = $('<img>');
    img.attr('src', path);
    var div = $('<div class="img-wrapper col-6 col-md-4">').append(img);
    $("#collage").prepend(div);
  }

  // ---------------------------------------------------- //

  initializeBranding() {
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

  getTimestamp(now) {
    var secs = now.getSeconds() < 10 ? '0'+now.getSeconds() : now.getSeconds();
    var mins = now.getMinutes() < 10 ? '0'+now.getMinutes() : now.getMinutes();
    var hours = now.getHours() < 10 ? '0'+now.getHours() : now.getHours();
    var date = now.getDate() < 10 ? '0'+String(now.getDate()) : String(now.getDate());
    var month = (now.getMonth()+1) < 10 ? '0'+String(now.getMonth()+1) : String(now.getMonth()+1);
    var year = String(now.getFullYear());

    return year+month+date+'_'+hours+'-'+mins+'-'+secs;
  }

  getDate(now) {
    return now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate();
  }

  printIpAddresses() {
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

  checkGrayscaleMode() {
    if (config.init.grayscaleMode) {
      console.log("using grayscale mode");
      $('head').append('<link rel="stylesheet" type="text/css" href="css/grayscale.css">');
    }
  }

}

/*
 * Module exports for connection
 */

var utils = new Utils();

export { Utils, utils };