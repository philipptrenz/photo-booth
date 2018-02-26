# photo booth

**A Photo Booth Software using Electron, gphoto2 and your camera**

![photo booth image from The Verge](https://cdn.vox-cdn.com/thumbor/gkbHIytNYvEPwbLLVxmVuTA5cjM=/1600x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/9062729/akrales_170815_1889_0006.jpg)

## How it works

Simply connect your camera (e.g. I have a Nikon D5300) via USB or even via wifi to the computer running this application. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera, shrinks it to a smaller size and displays it on the screen. First in fullscreen, then added to a gallery of previous taken photos.

photo booth also provides a web application by running a webserver. Every newly taken photo gets pushed to the website and displayed. From there it's easy to download all images. There's also the option to leave a e-mail address for sending the photos afterwards.

Because of the use of gphoto2 it works with nearly any camera like plug and play. A list of supported devices you can found [here](http://gphoto.org/proj/libgphoto2/support.php).

## Installation

To clone and run this repository you'll need [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) and [gphoto2](http://gphoto.sourceforge.net/) installed on your computer. 

I ran this app on Ubuntu Linux (64bit), MacOS 10.12 and Raspbian JESSIE (Raspberry Pi 3, ARM) and it works fine. **If you want to run photo-booth on Raspbian STRETCH (latest Raspbian version) please note the hints above!** It will probably not work on Windows, but not sure what Node.js magic is capable of. Anyway, the documentation here will be focused on Linux based systems. 

**NOTE:** Please use Raspbian Jessie, Raspbian STRETCH causes some problems, probably because of the Pixel desktop.

From your command line:

```bash
# Install needed dependencies
sudo apt-get install git npm gphoto2 libxss-dev libgconf-2-4 libnss3

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



**For Raspbian STRETCH:**

```bash
# Install needed dependencies
sudo apt-get install git gphoto2 libxss-dev libgconf-2-4 libnss3
git clone https://github.com/audstanley/NodeJs-Raspberry-Pi-Arm7 && cd NodeJs-Raspberry-Pi-Arm7 && chmod +x Install-Node.sh && sudo ./Install-Node.sh;

# If you want to use a Raspberry Pi > 1: Activate hardware acceleration
sudo apt-get install libgl1-mesa-dri
sudo nano /boot/config.txt 	# Add `dtoverlay=vc4-kms-v3d`

# Clone this repository
git clone https://github.com/philipptrenz/photo-booth
# Go into the repository
cd photo-booth
# Install dependencies and run the app
npm install && ./node_modules/.bin/electron-rebuild
sudo bash start.sh
```

**NOTE:** For using GPIO Pins and starting the web server the application has to run as root!

**HINT:** The little linux tool `unclutter` can hide the cursor.

If you run into any problems feel free to report an issue, I'll try to help!

 
## Configure it

The project includes a config.json file. There you can set several parameters, e.g. to start in fullscreen or not or if you want to keep your taken photos on your camera.

It looks like this:

```json
{
	"init": {
		"fullscreen": false,
		"width": "1440",
		"height": "900",
		"showDevTools": true,
		"useGPIO": true
	},
	"maxImageSize": "1500",
	"gphoto2": {
		"keepImagesOnCamera": true,
		"captureTarget": 1,
		"port": null,
		"optionalParameter": null
	},
	"errorMessage": "<i class='fa fa-exclamation-circle' aria-hidden='true' style='font-size: 1em; padding-right: 10px;'></i> Oh shit ...",
	"content_dir": "",
	"webapp": {
		"password": "test"
	},
	"branding": {
		"type": "text",
		"content": "<div style='font-size: 1.2em; padding-left: 25px;'><i class='fa fa-wifi' aria-hidden='true' style='font-size: 2.5em;'></i> <b style='font-size: 2em; padding-left: 15px;'>photo-booth</b><br /><p>Log into wifi, browse to <b style='padding: 0 5px;'>photo.app</b> and download your photos!</p></div>",
		"position": "bottomleft"
	}
}
```
Some notes to this:

* Booleans are always `true` or `false`
* Images get shrinked after got downloaded from the camera, set the size with maxImageWidth
* You have to figure out the captureTarget of your camera. Even if you choose to keep images at the camera, if gphoto2 chooses to store by default to the RAM of your camera, images get deleted when camera get turned off. Figure out the right captureTarget by running `gphoto2 --get-config=capturetarget`, then choose something should named sd card or so. This should be your first try if a photo gets taken, but it won't show up at the screen.
* The gphoto2 port definition can be null, then gphoto2 searches for your camera via USB, this works mostly. Also `serial` and `ptpip` for connection over wifi is available. When using wifi you'll need to define the IP address of your camera, this could look like this: `ptpip:192.168.1.1`
* Optional parameters for gphoto2 can be applied as string
* The errorMessage is pure HTML, just type in what you want. It gets displayed, if anything went wrong

## Let everyone download their photos via wifi

As mentioned above photo booth has a built in web page where images can be downloaded. 

For an easy way to use it, start a open wifi hotspot on the computer photo booth runs on. If you use a Raspberry Pi, there're enough tutorials out there to figure it out. Then connect your device, e.g. a smartphone, with the wifi, open your browser and type in the ip address of the Pi. More elegant is it to configure a DNS redirect so the users can type in a web address like "photo.booth", therefor I use dnsmasq which is also configured as DHCP server.

## Use a push button to trigger photos

You can connect a physical push button to the GPIO Pins of your Pi to trigger photos!

Therefore activate the GPIOs by setting `"useGPIO": true` in config.json. Then connect the first port of the push button to the ground pin of your Pi, second to GPIO 3 (PIN 5) and to a resistor of about 10k-100kΩ, the other end of the resistor to 3.3V (e.g. PIN 1). That's all!

**Make sure you run the application as root (`sudo npm start`), GPIOs need root privileges.**

```
 _______RASPBERRY PI_______
                          |
          |----3.3V---●o  |
 ~50kΩ →  ▯           oo  |
          |----GPIO3--●o  |
      [-\             oo  |
         \------GND---●o  |
                      oo  |
                      oo  |
                      oo  |
                      oo  |
                      oo  |
                      oo  |
                      oo  |
                      oo  |
                          |
                          |
```

## Connect your camera via wifi

Maybe you want to connect your camera via builtin wifi to an Raspberry Pi running this app, then follow these steps:

1. Figure out the SSID broadcasted by your camera, e.g. by command `sudo iwlist wlan0 scan`
2. Run `sudo iwconfig wlan0 essid name_of_my_cameras_wifi`
If you need more complex preferences, like wpa-key, use the `/etc/wpa_supplicant/wpa_supplicant.conf`
3. Restart wifi with `sudo ifdown wlan0 && sudo ifup wlan0`
4. Make shure your cameras wifi is enabled
5. Run `ifconfig` and look up your IP address on wlan0, e.g. 192.168.1.X
6. Try to run `gphoto2 --port ptpip:192.168.1.1 --capture-image` - the last digit of the IP address has to be 1, that's your camera ;)
7. Edit to your config.json `..."port": "ptpip:192.168.1.1", ...` and restart photo-booth

**NOTE:** My Nikon first didn't want to work via wifi, then I figured out that the gphoto2 and libgphoto2 version from the package manager were far to old. Install latest version of gphoto2 with this [gphoto2-updater scipt](https://github.com/gonzalo/gphoto2-updater) and star that project, it deserves it!


## Mentions

The project got featured at **[The Verge](https://www.theverge.com/circuitbreaker/2017/8/24/16193418/diy-photo-booth-party-wedding-dlsr-camera-how-to-build-raspberry-pi)**, incredible!

Also take a look at the video they made at **[Facebook](https://www.facebook.com/circuitbreaker/videos/1839861396306681/)!**
