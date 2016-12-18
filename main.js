const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

var config = require('./config.json');

function createWindow () {

  var fullscreen = config.init.fullscreen !== undefined ? config.init.fullscreen:true;
  console.log(config.init);
  var width = config.init.width?config.init.width:800
  var height = config.init.height?config.init.height:600

  var windowSettings = {
      fullscreen: fullscreen,
      width: width, 
      height: height, 
      backgroundColor: '#000000'
    };

  // Create the browser window.
  mainWindow = new BrowserWindow(windowSettings)
  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/booth.html`);

  // Open the DevTools.
  const showDevTools = config.init.showDevTools !== undefined ? config.init.showDevTools: false;
  if (showDevTools) mainWindow.webContents.openDevTools();


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
