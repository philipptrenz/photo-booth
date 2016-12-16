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

  var windowSettings = {
    fullscreen: config.fullscreen !== undefined ? config.fullscreen : true,
    width: 1440, 
    height: 900, 
    backgroundColor: '#000000'
  };
  console.log((!config.fullscreen ? 'not ':'')+'starting in fullscreen');


  // Create the browser window.
  mainWindow = new BrowserWindow(windowSettings)
  mainWindow.setMenu(null);

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/booth.html`);

  // Open the DevTools.
  const showDevTools = config.showDevTools !== undefined ? config.showDevTools: false;
  if (showDevTools) mainWindow.webContents.openDevTools();
  console.log((!config.showDevTools ? 'not ':'')+'opening developer tools');


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