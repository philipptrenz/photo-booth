import { create } from 'handlebars';
import handlebarsHelpers from 'handlebars-helpers';

import { handlebarsHelper as translateHelper } from './translation-service.js';

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

        // Register general helpers
        handlebarsHelpers(['comparison', 'string'], {
            handlebars: this.handlebars
        });

        // Register custom helpers
        this._registerHelper(translateHelper);
    }

    _registerHelper(helper) {
        this.handlebars.registerHelper(helper.name, helper.onExecute.bind(helper));
    }
}

let templateService = new TemplateService()
export {
    templateService as default
};