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

import os from 'os';
import fs from 'fs';
import $ from 'jquery';
import path from 'path';
import sharp from 'sharp';


class Utils {

  constructor() {

    var defaultConfig = path.join(__dirname, '../', './config.json');
    var ownConfig = path.join(__dirname, '../', './my.config.json');
    this.config_path = fs.existsSync(ownConfig) ? ownConfig : defaultConfig;

    this.defaultContentDirectory = path.join(__dirname, '../', '/content');
    this.webappSymlink = path.join(__dirname, "../", "./webapp/photos");

    this.maxImages = 20;

    this.getConfig();
    this.checkGrayscaleMode();
    this.getContentDirectory();

    this.initializeBranding();
    this.loadRecentImagesAfterStart();
    this.printIpAddresses();
  }

  getConfig(force = false) {
    if (!this.config || force) {
      this.config = require(this.config_path);
      return this.config;
    }
    return this.config;
  }

  saveConfig(new_config, callback) {

    // TODO: Add json-schema validation for config.json

    if (!new_config) {
      callback(false);
      return;
    }

    var self = this;
    fs.writeFile(this.config_path, JSON.stringify(new_config, null, "\t"), function (err) {
      if (err) {
        console.error('utils: updating config.json failed', err);
        callback(false, err);
      } else {
        // force config.json to be reloaded
        const _path = require.resolve(self.config_path);
        delete require.cache[_path];

        self.config = require(self.config_path); // should not be needed
        //console.log('utils: config.json updated: \n'+JSON.stringify(self.config, null, "\t"));
        console.log('utils: config.json updated');
        callback(true);
      }
    });
  }

  getContentDirectory() {
    if (this.contentDir === undefined) {
      var newContentDir = this.config.content_dir;
      if ( newContentDir !== null && typeof newContentDir === 'string' && newContentDir.length > 0) {  // if valid path in config
        try {
          if (!fs.existsSync(String(newContentDir))) fs.mkdirSync(String(newContentDir));
          this.contentDir = (newContentDir.startsWith('/')) ? newContentDir : path.join(__dirname, '../', newContentDir );
        } catch (err) {
          // fallback: default
          console.error('Could not open or create content_dir \''+this.config.content_dir+'\' like defined in config.json. '+err+'\nInstead going to use default \'',this.defaultContentDirectory,'\'');
          if (!fs.existsSync(this.defaultContentDirectory)) fs.mkdirSync(this.defaultContentDirectory);
          this.contentDir = this.defaultContentDirectory;
        }
      } else {
        // fallback: default
        if (!fs.existsSync(this.defaultContentDirectory)) fs.mkdirSync(this.defaultContentDirectory);
        this.contentDir = this.defaultContentDirectory;
      }
    }

    // initalized the depending directories
    this.getPhotosDirectory();
    this.getWebAppPhotosDirectory();

    return this.contentDir;
  }

  getPhotosDirectory() {
    if (this.photosDir === undefined) {
      const photoDir = path.join(this.contentDir, "photos/");
      if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir);
      this.photosDir = photoDir;
      return this.photosDir;
    }
    return this.photosDir;
  }

  getWebAppPhotosDirectory() {
    // TODO: Add a workaround for windows systems
    // if (this.webappSymlinkInitialized === undefined || !this.webappSymlinkInitialized) {
    //   if (fs.existsSync(this.webappSymlink)) {
    //     try {
    //       fs.unlinkSync(this.webappSymlink);
    //     } catch (err) {
    //       console.error('utils: could not remove old symlink, probably a problem with access rights', err);
    //     }
    //   }
    //   fs.symlinkSync(this.photosDir, this.webappSymlink);
    //   this.webappSymlinkInitialized = true;
    // }
    return 'photos/';
  }

  // ---------------------------------------------------- //

  loadRecentImagesAfterStart() {

    var photos_dir = this.getPhotosDirectory();
    var self = this;
    fs.readdir(photos_dir, function(err, files){

      if (files) {
        files.sort();
        var numberImages = (files.length < self.maxImages) ? files.length : self.maxImages;
        for (var i = 0; i < numberImages; i++) {
          //console.log(photos_dir+"/"+files[i]);
          // just take jpegs
          if ( files[i].endsWith(".jpg") || files[i].endsWith(".jpeg") || files[i].endsWith(".JPG") || files[i].endsWith(".JPEG") ){
            self.prependImage(self.getPhotosDirectory()+"/"+files[i]);
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
    if (this.config.branding) {

      var type = this.config.branding.type
      if (type) {
        if (type == 'text') {
          $('#front').html(this.config.branding.content);
        } else if (type == 'image') {
          $('#front').html("Not yet implemented");
        }
      }


      var position = this.config.branding.position
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

  getTimestamp(now = new Date()) {
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
          console.log("utils: interface", ifname + ':' + alias, iface.address);
        } else {
          // this interface has only one ipv4 adress
          console.log("utils: interface", ifname, iface.address);
        }
        ++alias;
      });
    });
  }

  checkGrayscaleMode() {
    if (this.getConfig().init.grayscaleMode) {
      console.log("utils: using grayscale mode");
      $('head').append('<link rel="stylesheet" type="text/css" href="css/grayscale.css">');
    }
  }

  convertImageForDownload(filename, grayscale, callback) {

    var self = this;
    var _path = path.join(this.photosDir, filename);
    var newFilename = 'photo-booth_'+filename.replace('img_', '');
    var tmpDir = path.join(this.getPhotosDirectory(), './tmp');
    var convertedFilepath = path.join(this.getPhotosDirectory(), './tmp', newFilename);
    var webappFilepath = path.join(this.getWebAppPhotosDirectory(), 'tmp', newFilename);

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    function cb(err) {
      if (err) {
        callback(false, 'resizing image failed', err)
      } else {
        callback(true, webappFilepath);
      }
      // delete file after 10s
      setInterval(function(){
        if (fs.existsSync(convertedFilepath)) fs.unlinkSync(convertedFilepath);
      },10000);
    }

    if (grayscale) {
      sharp(_path) // resize image to given maxSize
        .grayscale()
        .resize(self.config.webapp.maxDownloadImageSize)  // Scale down images on webapp
        .toFile(convertedFilepath, cb);
    } else {
      sharp(_path) // resize image to given maxSize
        .resize(self.config.webapp.maxDownloadImageSize)  // Scale down images on webapp
        .toFile(convertedFilepath, cb);
    }
  }

}

/*
 * Module exports for connection
 */
 let utils = new Utils()
export { utils as default };