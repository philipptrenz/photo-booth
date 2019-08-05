import { create } from "handlebars";

import { handlebarsHelper } from './translation-service.js';

class TemplateService {
    constructor() {
        this.isInitialized = false;
        this.handlebars = null;
    }

    applyTemplate(template, data = { }) {
        this._init();

        const compiledTemplate = this.handlebars.compile(template);
        return compiledTemplate(data);
    }

    _init() {
        if (this.isInitialized) {
            return;
        }

        this.handlebars = create();
        this.handlebars.registerHelper(handlebarsHelper.name, handlebarsHelper.onExecute.bind(handlebarsHelper));
    }
}

let templateService = new TemplateService()
export {
    templateService as default
};