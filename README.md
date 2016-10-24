# Photo Booth

**A Photo Booth Software using Electron, gphoto2 and your camera**

## How it works

Simply connect your camera (e.g. I have a Nikon D5300) via USB or even via WiFi to the computer running this application. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera, reduces and displays it on the screen. First in fullscreen, then added to a gallery of previous taken photos.

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

It looks like this:

```json
{
	"fullscreen": 		false,
	"showDevTools": 	true,
	"maxImageSize": 	1500,
	"useGPIO": 			true,
	"gphoto2": {
		"keepImagesOnCamera": 	true,
		"captureTarget": 		1,
		"port":					"ptpip:192.168.1.1",
		"optionalParameter": 	null
		"	},
	"errorMessage": 	"Bitte versuch es nochmal ..."
}
```

Maybe you want to connect your camera via builtin WiFi to an Raspberry Pi running this app (this is my cenario), then follow these steps:

1. Figure out the SSID broadcasted by your camera, e.g. by command `sudo iwlist wlan0 scan`
2. Run `sudo nano /etc/wpa_supplicant/wpa_supplicant.conf` and add at the bottom:
```
network={
    ssid="<Your cameras SSID>"
    key_mgmt=NONE
}
```
If your camera is secured, use `psk="<Your WiFi password>"`
3. Restart WiFi with `sudo ifdown wlan0 && sudo ifup wlan0`
4. Make shure your cameras WiFi is enabled
5. Run `ifconfig` and look up your IP address on wlan0, e.g. 192.168.1.X
6. Try to run `gphoto2 --port ptpip:192.168.1.1 --capture-image` - the last digit of the IP address has to be 1, that's your camera ;)
7. Edit to your config.json `..."port": "ptpip:192.168.1.1", ...` and restart photo-booth

**NOTE:** My Nikon first didn't want to work via WiFi, then I figured out that the  gphoto2 and libgphoto2 version from the package manager is far to old. If you want to install the latest version, just use this [gphoto2-updater scipt](https://github.com/gonzalo/gphoto2-updater)