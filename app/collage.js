import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { exec } from 'child_process';

import sharp from 'sharp';

import utils from "./utils.js";

class Collage {
    constructor() {
        this.layouts = utils.getConfig().printing.layouts || [];
    }

    getPlaceholderImage(layout, callback) {
        const options = this._getOptionsByLayout(layout);

        // Calculate filename by options (cache placeholders)
        const optionsAsJson = JSON.stringify(options);
        const optionsHash = createHash('md5').update(optionsAsJson).digest('hex');
        const fileName = layout + '_' + optionsHash + '.jpeg';
        const filePath = path.join(utils.getTempDir(), fileName);

        // Check existance
        if (fs.existsSync(filePath)) {
            callback(false, filePath);
            return;
        }

        const tempFile = path.join(utils.getTempDir(), layout + '_' + utils.getTimestamp() + '.jpeg');
        const that = this;
        sharp({
            create: {
                width: options.imageWidth,
                height: options.imageHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 0.5 }
            }
        })
        .jpeg()
        .toFile(tempFile, function(error) {
            if (error) {
                callback(error);
                return;
            }

            const images = new Array(options.width * options.height).fill(tempFile);
            const clonedOptions = JSON.parse(optionsAsJson);
            clonedOptions.dpi = 96;

            that._createCollage(filePath, clonedOptions, images, function(error) {
                utils.queueFileDeletion(tempFile);

                if (error) {
                    callback(error);
                } else {
                    callback(false, filePath);
                }
            });
        });
    }

    createPreviewCollage(layout, images, callback) {
        const newFilename = 'print_' + utils.getTimestamp() + '.jpeg';
        const convertedFilepath = path.join(utils.getTempDir(), newFilename);
        const webappFilepath = path.join('photos', 'tmp', newFilename);

        const options = this._getOptionsByLayout(layout);
        const clonedOptions = JSON.parse(JSON.stringify(options));
        clonedOptions.dpi = 96;

        this._createCollage(convertedFilepath, clonedOptions, images, function(err) {
            utils.queueFileDeletion(convertedFilepath);

            if (err) {
                callback(err);
            } else {
                callback(false, webappFilepath);
            }
        });
    }

    createCollage(layout, images, callback) {
        const newFilename = 'print_' + utils.getTimestamp() + '.jpeg';
        const convertedFilepath = path.join(utils.getFullSizePhotosDirectory(), newFilename);

        const options = this._getOptionsByLayout(layout);
        this._createCollage(convertedFilepath, options, images, function(err) {
            if (err) {
                callback(err);
            } else {
                callback(false, convertedFilepath);
            }
        });
    }

    _createCollage(filePath, options, images, callback) {
        const params = [
            'node',
            './collage-process.js',
            filePath,
            JSON.stringify(options).replace(/"/g, '\'')
        ];

        params.push(...images);

        const childProcess = exec(params.join(' '), {
            cwd: './helpers/collage'
        }, function(error, stdout, stderr) {
            if (error) {
                callback(error);
            } else {
                callback(false);
            }
        });
    }

    _getOptionsByLayout(layoutName) {
        const layout = this.layouts.find(e => e.key === layoutName);
        if (layout === undefined) {
            throw new Error('Layout ' + layoutName + ' is not defined!');
        }

        return layout.options;
    }
}

let collage = new Collage();
export { collage as default };