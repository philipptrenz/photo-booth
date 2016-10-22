# Photo Booth

**A Photo Booth Software using Electron, gPhoto2, Python and your Camera**

NOTE: Still under development, this is not yet working!

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
npm install && npm start
```

If you're using a Raspberry Pi, activate hardware acceleration by adding `dtoverlay=vc4-kms-v3d` to /boot/config.txt


Learn more about Electron and its API in the [documentation](http://electron.atom.io/docs/latest).
