# Photo Booth

**A Photo Booth Software using Electron, gPhoto2, Python and your Camera**

NOTE: Still under development, this is not yet working!

## How it works

Simply connect your camera (e.g. I have a Nikon D5300) via USB to the computer running this application. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera and displays it at the screen. First in fullscreen, then it adds it to a gallery of previous taken photos.

Because of the use of gphoto2 it works with nearly any cameras like plug and play. A list of supported devices you can find [here](http://gphoto.org/proj/libgphoto2/support.php).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Install needed dependencies
sudo apt-get install libgphoto2-6 libgphoto2-dev libgphoto2-port10 python-dev python-pip libjpeg-dev libgl1-mesa-dri

# Install Python gPhoto2 Interface
sudo pip install gphoto2 Pillow

# Clone this repository
git clone https://github.com/philipptrenz/photo-booth
# Go into the repository
cd photo-booth
# Install dependencies and run the app
npm install && ./node_modules/.bin/electron-rebuild
[sudo] npm start
```
**NOTE: For using GPIO Pins the application has to run as root!**

If you're using a Raspberry Pi, activate hardware acceleration by adding `dtoverlay=vc4-kms-v3d` to /boot/config.txt


Learn more about Electron and its API in the [documentation](http://electron.atom.io/docs/latest).
