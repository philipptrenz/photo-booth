# photo booth

**A Photo Booth Software using Electron, gphoto2 and your camera**

## How it works

Simply connect your camera (e.g. I have a Nikon D5300) via USB or even via WiFi to the computer running this application. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera, shrinks it to a smaller size and displays it on the screen. First in fullscreen, then added to a gallery of previous taken photos.

photo booth also provides a web application by running a webserver. Every newly taken photo gets pushed to the website and displayed. From there it's easy to download all images. There's also the option to leave a e-mail address for sending the photos afterwards.

Because of the use of gphoto2 it works with nearly any camera like plug and play. A list of supported devices you can find [here](http://gphoto.org/proj/libgphoto2/support.php).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) and [gphoto2](http://gphoto.sourceforge.net/) installed on your computer. From your command line:

```bash
# Install needed dependencies
sudo apt-get install git npm gphoto2 libxss-dev libgconf-2-4

# If you want to use a Raspberry Pi > 1: Activate hardware acceleration
sudo apt-get install libgl1-mesa-dri
sudo nano /boot/config.txt 	# Add `dtoverlay=vc4-kms-v3d`

# Clone this repository
git clone https://github.com/philipptrenz/photo-booth
# Go into the repository
cd photo-booth
# Install dependencies and run the app
npm install && ./node_modules/.bin/electron-rebuild
sudo npm start
```
**NOTE:** For using GPIO Pins and starting the web server the application has to run as root!

**HINT:** The little linux tool `unclutter` can hide the cursor.
 
## Configure it

The project includes a config.json file. There you can set several parameters, e.g. to start in fullscreen or not or if you want to keep your taken photos on your camera.

It looks like this:

```json
{
	"fullscreen": 		false,
	"showDevTools": 	true,
	"useGPIO": 			true,
	"maxImageSize": 	1500,
	"gphoto2": {
		"keepImagesOnCamera": 	true,
		"captureTarget": 		1,
		"port":					"usb",
		"optionalParameter": 	null
	},
	"errorMessage": 	"ooops, shit happend 💩",
	"frontCover":		"<p>This is HTML</p>"
}
```
Some notes to this:

* Booleans are always `true` or `false`
* Images get shrinked after got downloaded from the camera, set the size with maxImageWidth
* You have to figure out the captureTarget of your camera. Even if you choose to keep images at the camera, if gphoto2 chooses to store by default to the RAM of your camera, images get deleted when camera get turned off. Figure out the right captureTarget by running `gphoto2 --get-config=capturetarget`, then choose something should named sd card or so.
* The gphoto2 port definition can be null, then gphoto2 searches for your camera via USB, this works mostly. Also `serial` and `ptpip` for connection over WiFi is available. When using WiFi you'll need to define the IP address of your camera, this could look like this: `ptpip:192.168.1.1`
* Optional parameters for gphoto2 can be applied as string
* The errorMessage is pure HTML, just type in what you want. It gets displayed, if anything went wrong

## Let everyone download their images via Wifi

As mentioned above photo booth has a built in web page where images can be downloaded. 

For an easy way to use it, start a open WiFi Hotspot on the computer photo booth runs on. If you use a Raspberry Pi, there're enough tutorials out there to figure it out. Then connect your device, e.g. a smartphone, with the WiFi, open your browser and type in the ip address of the Pi. More elegant is it to configure a DNS redirect so the users can type in a web address like "photo.booth".

## Connect your camera via WiFi

Maybe you want to connect your camera via builtin WiFi to an Raspberry Pi running this app, then follow these steps:

1. Figure out the SSID broadcasted by your camera, e.g. by command `sudo iwlist wlan0 scan`
2. Run `sudo iwconfig wlan0 essid name_of_my_cameras_wifi`
If you need more complex preferences, like wpa-key, use the `/etc/wpa_supplicant/wpa_supplicant.conf`
3. Restart WiFi with `sudo ifdown wlan0 && sudo ifup wlan0`
4. Make shure your cameras WiFi is enabled
5. Run `ifconfig` and look up your IP address on wlan0, e.g. 192.168.1.X
6. Try to run `gphoto2 --port ptpip:192.168.1.1 --capture-image` - the last digit of the IP address has to be 1, that's your camera ;)
7. Edit to your config.json `..."port": "ptpip:192.168.1.1", ...` and restart photo-booth

**NOTE:** My Nikon first didn't want to work via WiFi, then I figured out that the gphoto2 and libgphoto2 version from the package manager were far to old. Install latest version of gphoto2 with this [gphoto2-updater scipt](https://github.com/gonzalo/gphoto2-updater) and star it, he deserves it!