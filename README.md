[![Build Status](https://img.shields.io/travis/philipptrenz/photo-booth.svg)](https://travis-ci.org/philipptrenz/photo-booth)
[![npm version](https://badge.fury.io/js/%40philipptrenz%2Fphoto-booth.svg)](https://badge.fury.io/js/%40philipptrenz%2Fphoto-booth)

# photo-booth

A multi-platform photo booth software using Electron and your camera

![photo booth image from The Verge](https://cdn.vox-cdn.com/thumbor/gkbHIytNYvEPwbLLVxmVuTA5cjM=/1600x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/9062729/akrales_170815_1889_0006.jpg)
(Source: [The Verge](https://www.theverge.com/circuitbreaker/2017/8/24/16193418/diy-photo-booth-party-wedding-dlsr-camera-how-to-build-raspberry-pi), accessed 08 March 2018)

## Community

**Please note:**

Due to personal time constraints, I can no longer answer installation and configuration questions. In keeping with the Open Source philosophy, I have set up a mailing list to serve as a platform for exchange between new and experienced users. Therefore, I ask that as many as possible participate in the mailing list in order to share experiences as well as to provide assistance.

Send an empty email to [photo-booth-subscribe@philipptrenz.de](mailto:photo-booth-subscribe@philipptrenz.de) to join the list, then ask your questions to [photo-booth@philipptrenz.de](mailto:photo-booth@philipptrenz.de).

For feature requests and bug reports feel free to open an [issue](http://github.com/philipptrenz/photo-booth/issues).

If you like my project and you want to keep me motivated:

<a href='https://ko-fi.com/U7U6COXD' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://az743702.vo.msecnd.net/cdn/kofi2.png?v=0' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

## How it works

Simply connect your camera via USB or even via wifi to the computer running this application, for example a **Raspberry Pi**. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera, shrinks it to a smaller size and displays it on the screen. First in fullscreen, then added to a gallery of previous taken photos.

photo-booth also provides a web application by running a webserver. Every newly taken photo gets immediately pushed to the webapp. From there it's easy for your guests to download their photos. There's also the option to leave a e-mail address for sending the photos afterwards. You only have to provide a Wi-Fi hotspot.

Because of the use of gphoto2 it works with nearly any camera like plug and play.

## Installation

To clone and run this repository you'll need [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/) and [gphoto2](http://gphoto.sourceforge.net/) installed. 

Before getting started please check [here](#Unsupported-devices) if the hardware you want to use is supported. I tested photo-booth under Ubuntu Linux (64bit), MacOS and Raspbian (Raspberry Pi 3, ARM). Anyway, the documentation here will be focused on Linux based systems. 

**Raspbian STRETCH (with desktop):**

```bash
# Install needed dependencies
sudo apt update
sudo apt install git libxss-dev libgconf-2-4 libnss3

# Install latest version of libgphoto2, choose last stable release
wget https://raw.githubusercontent.com/gonzalo/gphoto2-updater/master/gphoto2-updater.sh && sudo bash gphoto2-updater.sh

# If you are using a Raspberry Pi > 1: Activate hardware acceleration
sudo apt install libgl1-mesa-dri
sudo su -c 'grep -q -F "dtoverlay=vc4-kms-v3d" /boot/config.txt || echo "dtoverlay=vc4-kms-v3d" >> /boot/config.txt'

# Clone the repository
git clone https://github.com/philipptrenz/photo-booth.git && cd photo-booth

# Make the Node installation script executable
sudo chmod +x ./scripts/install_node_v9.sh

# Install node
sudo ./scripts/install_node_v9.sh

# Install
npm install
```

## Run photo-booth

To run photo-booth the following command should do it. To run the webapp on port 80 and for the usage of GPIO pins at the Raspberry Pi root privileges are required.

**WORKAROUND FOR RASPBERRY PI 3 if Photo-Booth stays black**

```
export LD_PRELOAD=node_modules/sharp/vendor/lib/libz.so
```

**Important:** The command needs to be run from a terminal on the GUI, executing via SSH will most likely fail!

```
sudo npm start
```

Basically, it's not a good idea to run a web server as root, if you do not need GPIOs consider setting up a redirect from port 80 to 8080 on your system. That can be achieved by a iptables rule for example. Then you can start photo-booth with

```
npm start
```

**HINT:** The little linux tool `unclutter` can hide the cursor.

## Start photo-booth on boot (for Raspberry Pi)

To start photo-booth on boot add the following line at the end of `/home/pi/.config/lxsession/LXDE-pi/autostart`:

```
@sudo node /home/pi/photo-booth/scripts/cli.js
```

 
## Configure it

There are a few settings and options that you should take a look at.


### The `config.json`

The project includes a config.json file. There you can set several parameters, e.g. to start in fullscreen or not or if you want to keep your taken photos on your camera.

It looks like this:

```json
{
	"init": {
		"fullscreen": true,
		"width": "1440",
		"height": "900",
		"showDevTools": false,
		"useGPIO": false,
		"grayscaleMode": true,
		"preventScreensaver": false
	},
	"maxImageSize": 1500,
	"countdownLength": 5,
	"slideshow": {
		"enabled": true,
		"activatesAfterSeconds": 30,
		"secondsPerImages": 8
	},
	"gphoto2": {
		"capturetarget": 1,
		"keep": true
	},
	"content_dir": null,
	"webapp": {
		"password": "test",
		"maxDownloadImageSize": 800,
		"enableRemoteRelease": true
	},
	"branding": {
		"type": "text",
		"content": "<div style='font-size: 1.2em; padding-left: 25px;'><i class='fa fa-wifi' aria-hidden='true' style='font-size: 2.5em;'></i> <b style='font-size: 2em; padding-left: 15px;'>photo-booth</b><br /><p>Log into wifi, browse to <b style='padding: 0 5px;'>photo.app</b> and download your photos!</p></div>",
		"position": "bottomleft"
	}
}
```

Best way to modify the `config.json` is by copying it to `my.config.json`, photo-booth will prefer the latter one:
```
cp config.json my.config.json
```


Some notes:

* Images get shrinked after got downloaded from the camera, set the size with maxImageWidth
* You have to figure out the captureTarget of your camera. Even if you choose to keep images at the camera, if gphoto2 chooses to store by default to the RAM of your camera, images get deleted when camera get turned off. Figure out the right captureTarget by running `gphoto2 --get-config=capturetarget`, then choose something should named sd card or so. This should be your first try if a photo gets taken, but it won't show up at the screen.
* If you want to keep images on camera, set `keep` to `true`
* The errorMessage is pure HTML, just fill in whatever you want

### How to use the integrated webapp

As mentioned above photo-booth has a built in web page where images can be downloaded. 

For an easy way to use it, start a open wifi hotspot on the computer photo-booth runs on. If you use a Raspberry Pi, there're enough tutorials out there to figure it out (i.e. [here](https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md)). Then connect your device, e.g. a smartphone, with the wifi, open your browser and type in the ip address of the Pi. More elegant is it to configure a DNS redirect so the users can type in a web address like "photo.app", therefore I use `dnsmasq` which is also configured as DHCP server.

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

## Unsupported devices

Please note that there are several devices which are not supported by photo-booth.

### Unsupported architectures

As Electron, the main framework, besides ia32 (i686) and x64 (amd64) only supports the ARM v7 architecture (and ARM v8 as it is backwards compatible), several ARM devices are not supported. Further information can be found [here](https://electronjs.org/docs/tutorial/support#linux). The following ARM devices among others can not be supported:

* Raspberry Pi Zero
* Raspberry Pi Zero W / WH 
* Raspberry Pi 1 A / A+
* Raspberry Pi 1 B / B+

### Unsupported cameras

* The Raspberry Pi camera module is not supported
* Webcams (such as those built into your laptop or Logitech USB) are not supported

Also some other DSLR and Compact Cameras are not supported. Please check for your specific model [here](http://gphoto.org/proj/libgphoto2/support.php).

## Common issues

If you have any problems, start reading here. If you do not find anything, check under [Issues](https://github.com/philipptrenz/photo-booth/issues), if someone else already had a similar problem. If you still have no solution, open a new issue.

### How to quit photo-booth in fullscreen?

Hit the Escape key to exit the fullscreen mode, then you can close the app.

### Why are all images in grayscale?

Go to `config.json` and change `grayscaleMode` to `false`.

### My camera takes a photo, but it does not show up

This may be related to wrong capture target settings. Run `gphoto2 --get-config capturetarget` from the console, the output looks something like this:

```
Label: Capture Target
Type: RADIO
Current: Internal RAM
Choice: 0 Memory card
Choice: 1 Internal RAM

```
Identify the number of the memory card and change the `captureTarget` property in `config.json`.

### error (-53 'could not claim the usb device')

It seems to be an old known problem with gvfs-gphoto2-volume-monitor module. For reference [read here](https://github.com/raspberrypi/linux/issues/218#issuecomment-38143613).

```
sudo rm /usr/share/dbus-1/services/org.gtk.vfs.GPhoto2VolumeMonitor.service
sudo rm /usr/share/gvfs/mounts/gphoto2.mount
sudo rm /usr/share/gvfs/remote-volume-monitors/gphoto2.monitor
sudo rm /usr/lib/gvfs/gvfs-gphoto2-volume-monitor
```

## Contributors

* [wikijm](https://github.com/wikijm)
* [blak3r](https://github.com/blak3r)
* [probststefan](https://github.com/probststefan)
* [jgoestl](https://github.com/jgoestl)

## Mentions

The project got featured at **[The Verge](https://www.theverge.com/circuitbreaker/2017/8/24/16193418/diy-photo-booth-party-wedding-dlsr-camera-how-to-build-raspberry-pi)**, incredible!
Also take a look at the video they made at **[Facebook](https://www.facebook.com/circuitbreaker/videos/1839861396306681/)!**

An article was also published in the **[blog of my degree course](http://www.medieninformatik.de/projekt-photo-booth-amerikaner-berichten/)** (in German).

[partyblitzer](https://github.com/partyblitzer) published a [post on his blog](http://tobias-senff.de/partyblitzer/) and a [video on YouTube](https://www.youtube.com/watch?v=ujMKFKPHP8k) using this software for his DIY photo booth setup.
