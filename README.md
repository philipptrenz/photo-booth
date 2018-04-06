# photo-booth

**A multi-platform Photo Booth Software using Electron, gphoto2 and your camera**

![photo-booth image from The Verge](https://cdn.vox-cdn.com/thumbor/gkbHIytNYvEPwbLLVxmVuTA5cjM=/1600x0/filters:no_upscale()/cdn.vox-cdn.com/uploads/chorus_asset/file/9062729/akrales_170815_1889_0006.jpg)
(Source: [The Verge](https://www.theverge.com/circuitbreaker/2017/8/24/16193418/diy-photo-booth-party-wedding-dlsr-camera-how-to-build-raspberry-pi), accessed 08 March 2018)

## How it works

Simply connect your camera (e.g. I have a Nikon D5300) via USB or even via wifi to the computer running this application. The app shows a countdown by clicking at the screen (or tapping at a touchscreen), triggers your camera to take a photo, downloads it from your camera, shrinks it to a smaller size and displays it on the screen. First in fullscreen, then added to a gallery of previous taken photos.

photo-booth also provides a web application by running a webserver. Every newly taken photo gets pushed to the website and displayed. From there it's easy to download all images. There's also the option to leave a e-mail address for sending the photos afterwards.

Because of the use of gphoto2 it works with nearly any camera like plug and play. A list of supported devices can be found [here](http://gphoto.org/proj/libgphoto2/support.php).

## Installation

To clone and run this repository you'll need [Git](https://git-scm.com), [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) and [gphoto2](http://gphoto.sourceforge.net/) installed on your computer. 

I tested it under Ubuntu Linux (64bit), MacOS and Raspbian (Raspberry Pi 3, ARM). It will probably not work on Windows. Anyway, the documentation here will be focused on Linux based systems. 

**Raspbian STRETCH:**

```bash
# Install needed dependencies
sudo apt update
sudo apt install git libxss-dev libgconf-2-4 libnss3

# Install node
sudo wget -O - https://raw.githubusercontent.com/audstanley/NodeJs-Raspberry-Pi/master/Install-Node.sh | sudo bash;

# Install latest version of libgphoto2
sudo wget https://raw.githubusercontent.com/gonzalo/gphoto2-updater/master/gphoto2-updater.sh 
sudo chmod +x gphoto2-updater.sh && sudo ./gphoto2-updater.sh

# If you want to use a Raspberry Pi > 1: Activate hardware acceleration
sudo apt install libgl1-mesa-dri
sudo nano /boot/config.txt 	# Add `dtoverlay=vc4-kms-v3d`

# Clone the dev branch of this repository
git clone -b dev https://github.com/philipptrenz/photo-booth.git
# Go into the repository
cd photo-booth
# Install dependencies
npm install && npm run rebuild
```


## Run photo-booth

To run photo-booth the following command should do it for systems with GUI:

```
npm start
```


If you want to use the webapp or a hardware button to trigger photos connected to the GPIOs of your Pi, photo-booth has to run with root privileges:

```
sudo npm start
```

**HINT:** The little linux tool `unclutter` can hide the cursor.


I personally run photo-booth on a `Raspbian Lite` image directly on X, for this case you can use the `start.sh` script to run photo-booth at boot as described below.

 
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
		"useGPIO": false,
		"grayscaleMode": true,
		"preventScreensaver": false
	},
	"maxImageSize": 1500,
	"gphoto2": {
		"capturetarget": 1,
		"keep": true,
		"keepImagesOnCamera": false
	},
	"content_dir": null,
	"webapp": {
		"password": "test",
		"maxDownloadImageSize": 1000
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

## How to use the integrated Webapp

As mentioned above photo-booth has a built in web page where images can be downloaded. 

For an easy way to use it, start a open wifi hotspot on the computer photo-booth runs on. If you use a Raspberry Pi, there're enough tutorials out there to figure it out (i.e. [here](https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md). Then connect your device, e.g. a smartphone, with the wifi, open your browser and type in the ip address of the Pi. More elegant is it to configure a DNS redirect so the users can type in a web address like "photo.app", therefore I use `dnsmasq` which is also configured as DHCP server.

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

## Run photo-booth on boot of your Raspberry Pi

It's as easy as this:
```
sudo cp start.sh /etc/init.d/photo-booth
sudo chmod 755 /etc/init.d/photo-booth
sudo update-rc.d photo-booth defaults
```

Now start the service via `sudo service photo-booth start` and check its status with `sudo service photo-booth status`.

## Common issues

If you have any problems, start reading here. If you do not find anything, check under [Issues](https://github.com/philipptrenz/photo-booth/issues), if someone else already had a similar problem. If you still have no solution, open a new issue.

### Why are all images in grayscale?

Go to `config.json` and change `grayscaleMode` to `false`.

### photo-booth is starting up, but I have just a black screen and the console says `module version mismatch expected 50, got ...`

Just run `./node_modules/.bin/electron-rebuild` again.

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

## Mentions

The project got featured at **[The Verge](https://www.theverge.com/circuitbreaker/2017/8/24/16193418/diy-photo-booth-party-wedding-dlsr-camera-how-to-build-raspberry-pi)**, incredible!
Also take a look at the video they made at **[Facebook](https://www.facebook.com/circuitbreaker/videos/1839861396306681/)!**

An article was also published in the **[blog of my degree course](http://www.medieninformatik.de/projekt-photo-booth-amerikaner-berichten/)** (in German).
