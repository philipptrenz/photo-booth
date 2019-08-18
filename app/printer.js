import fs from 'fs';
import nodePrinter from 'printer';

import utils from "./utils.js";

class Printer {
    constructor() {
        this.workingStates = ['PENDING', 'PRINTING'];
    }

    print(fileName, callback) {
        const printerConfig = utils.getConfig().printing || { };
        if (!printerConfig.enabled) {
            callback(new Error('Printing not enabled'));
            return;
        }

        const printerError = this._checkPrinter(printerConfig.printer);
        if (printerError != null) {
            callback(printerError);
            return;
        }

        const that = this;
        const fileContent = fs.readFileSync(fileName);
        nodePrinter.printDirect({
            printer: printerConfig.printer,
            data: fileContent,
            type: 'JPEG',
            success: function(jobId) {
                console.log('Print job queued successfully', jobId);
                that._checkJob(printerConfig.printer, jobId, callback);
            },
            error: function(err) {
                console.log('Print job queue failed', err);
                callback(err);
            }
        });
    }

    _checkPrinter(printerName) {
        try {
            const printer = nodePrinter.getPrinter(printerName);
            if (printer == null) {
                return new Error('Printer ' + printerName + ' not found');
            }

            return null;
        } catch (ex) {
            return ex;
        }
    }

    _checkJob(printerName, jobId, callback) {
        const jobInfo = nodePrinter.getJob(printerName, jobId);
        if (jobInfo == null) {
            console.log('Could not get job ' + jobId + ' info');
            callback(new Error('Could not get job info'));
            return;
        }

        if (jobInfo.status == null || this.workingStates.some(s => jobInfo.status.indexOf(s) !== -1)) {
            console.log('Job ' + jobId  + ' is no longer in a pending state. Current state:', jobInfo.status);
            callback(false, jobInfo);
            return;
        }

        console.log('Job ' + jobId  + ' is still in a pending state', jobInfo.status);
        const that = this;
        setTimeout(function() {
            that._checkJob(printerName, jobId, callback);
        }, 5000);
    }
}

const printer = new Printer();
export { printer as default };