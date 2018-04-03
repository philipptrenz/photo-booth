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

const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

var config = require('./config.json');

function createWindow () {

  var fullscreen = config.init.fullscreen !== undefined ? config.init.fullscreen:true;

  var width;
  var height;
  try {
     width = parseInt(config.init.width);
     height = parseInt(config.init.height);
  } catch (err) {
    width = 800;
    height = 600;
    console.log('loading width and height from config.json failed, fallback to 1440x900 \n'+err)
  }

  var windowSettings = {
    fullscreen: fullscreen,
    width: width,
    height: height,
    backgroundColor: '#000000'
  };

  console.log('window settings: '+JSON.stringify(windowSettings));

  // Create the browser window.
  mainWindow = new BrowserWindow(windowSettings)
  mainWindow.setMenu(null);

  //mainWindow.setFullScreen(fullscreen);

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/app/booth.html`);


  global.sharedObj = {mainWindow: mainWindow};

  ipcMain.on('toggle-devTools', function(event) {
    console.log("toggle-devTools ipc Event: "+event);
    console.log(global.sharedObj.mainWindow);
  });

  // Open the DevTools.
  const showDevTools = config.init.showDevTools !== undefined ? config.init.showDevTools: false;
  if (showDevTools) mainWindow.webContents.openDevTools();

  // Prevent Screensaver / Display Sleep
  const preventScreensaver = config.init.preventScreensaver !== undefined ? config.init.preventScreensaver : false;
  if (preventScreensaver) {
    const {powerSaveBlocker} = require('electron');
    const id = powerSaveBlocker.start('prevent-display-sleep');
    console.log('prevent screensaver: '+powerSaveBlocker.isStarted(id));
  }

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
