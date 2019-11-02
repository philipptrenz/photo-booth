import fs from 'fs';
import path from 'path';

import booth from './booth.js';
import utils from "./utils.js";
import collage from './collage.js';
import printer from './printer.js';

class Gpio {
    constructor() {
        this._globalConfig = null;
        this._config = null;
        this._printRunning = false; // Prevent multiple printouts
    }

    initialize() {
        this._loadConfig();

        if (this._config.enabled) {
            this._initGpio();
        }
    }

    _loadConfig() {
        this._globalConfig = utils.getConfig();
        this._config = this._globalConfig.GPIO;

        if (this._config != null) {
            return;
        }

        // Migrate old settings
        this._config = {};
        this._config.enabled = this._globalConfig.init.useGPIO;
        this._config.actions = [{
            channel: 3,
            action: 'triggerPhoto'
        }];
    }

    _initGpio() {
        console.log('GPIO usage activated');
        const gpio = require('rpi-gpio');

        gpio.setMode(gpio.MODE_BCM);

        for (let action of this._config.actions) {
            gpio.setup(action.channel, gpio.DIR_IN, gpio.EDGE_BOTH);
        }

        const that = this;
        gpio.on('change', function(channel, value) {
            that._gpioChange(channel, value);
        });
    }

    _gpioChange(channel, value) {
        if (value) {
            return;
        }

        const actions = this._config.actions.filter(e => e.channel == channel);
        for (let action of actions) {
            this._executeAction(action);
        }
    }

    // Make sure all actions don't run twice at the same time
    _executeAction(action) {
        console.log('GPIO action triggered', action.channel, action.action, action.options);

        switch(action.action) {
            case 'triggerPhoto':
                this._triggerPhoto(action.options);
                break;
            case 'print':
                this._print(action.options);
                break;
            default:
                console.log('GPIO action not defined, action = ', action.action);
        }
    }

    _triggerPhoto(options) {
        const photoSeriesLength = options == null ? undefined : options.photoSeriesLength;
        booth.triggerPhoto(function() { }, photoSeriesLength);
    }

    _print(options) {
        options = options || { };

        if (this._printRunning) {
            return;
        }

        const printingConfig = this._globalConfig.printing || { };
        if (!printingConfig.enabled) {
            console.log('GPIO print not enabled');
            return;
        }

        const layoutsConfig = printingConfig.layouts || [];
        const layout = layoutsConfig.find(e => e.key === options.layoutName);
        if (layout == null) {
            console.log('GPIO print layout not found, layout = ', options.layoutName);
            return;
        }

        const that = this;

        this._printRunning = true;
        const contentDir = utils.getPhotosDirectory();
        fs.readdir(contentDir, function(err, files) {
            if (err) {
                console.log('GPIO print read files error', err);
                that._printRunning = false;
                return;
            }

            files = files.filter(file => file.toLowerCase().endsWith(".jpg") || file.toLowerCase().endsWith(".jpeg"));
            files.sort();

            const maxImagesCount = layout.options.width * layout.options.height;
            const imagesToPrint = files.slice(-maxImagesCount);

            const paths = imagesToPrint
                .map(file => path.join(utils.getFullSizePhotosDirectory(), file));
            console.log('files to print', paths);

            collage.createCollage(layout.key, paths, function(err, collageFile) {
                if (err) {
                    console.log('GPIO print create collage error', err);
                    that._printRunning = false;
                    return;
                }

                console.log('GPIO printing image ', collageFile);

                const contentDir = utils.getContentDirectory();
                fs.appendFile(contentDir + '/print-log.txt', 'Print (GPIO)' + collageFile + '\n', function() { });

                printer.print(collageFile, function(err, jobInfo) {
                    that._printRunning = false;

                    let logMessage = 'Print (GPIO) result of ' + collageFile + '\n';

                    if (err) {
                        logMessage += 'FAILED ' +  err.toString();
                    } else {
                        logMessage += 'SUCCESSFULL ' + JSON.stringify(jobInfo);
                    }

                    fs.appendFile(contentDir + '/print-log.txt', logMessage + '\n', function() { });
                });
            });
        });
    }
}

const gpio = new Gpio();
export { gpio as default };