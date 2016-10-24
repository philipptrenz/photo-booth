# Photo Booth

**A Photo Booth Software using Electron, gphoto2 and your camera**

## How it works

Simply connect your camera (e.g. I have a Nikon D5300) via USB to the computer running this application. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera, reduces and displays it on the screen. First in fullscreen, then added to a gallery of previous taken photos.

Because of the use of gphoto2 it works with nearly any cameras plug and play. A list of supported devices you find [here](http://gphoto.org/proj/libgphoto2/support.php).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Install needed dependencies
sudo apt-get install git npm gphoto2 imagemagick 

# If you want to use a Raspberry Pi > 1: Activate hardware acceleration
sudo apt-get install libgl1-mesa-dri
sudo nano /boot/config.txt 	# Add `dtoverlay=vc4-kms-v3d`

# Clone this repository
git clone https://github.com/philipptrenz/photo-booth
# Go into the repository
cd photo-booth
# Install dependencies and run the app
npm install && ./node_modules/.bin/electron-rebuild
[sudo] npm start
```
**NOTE: For using GPIO Pins the application has to run as root!**

## Configure it

The project includes an config.json file. There you can set several parameters, e.g. to start in fullscreen or not or if you want to keep your taken photos on your camera.
