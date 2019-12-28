import i18next from "i18next";
import Backend from "i18next-node-fs-backend";

class TranslationService {
    constructor() {
        this.translate = null;
    }

    init(config, callback) {
        if (this.translate != null) {
            callback(false);
            return;
        }

        console.log('Using translations for language', config.language || 'en', 'with fallback language en');

        let translationDirectory = './i18n/{{lng}}.json';
        let i18nConfig = {
            lng: config.language,
            fallbackLng: 'en',

            backend: {
                loadPath: translationDirectory
            }
        };

        i18next
            .use(Backend)
            .init(i18nConfig, (error, t) => {
                if (error) {
                    console.log('Failed to load translations', error);
                    callback(error);
                    return;
                }

                this.translate = t;
                callback(false);
            });
    }
}

class HandlebarsHelper {
    constructor(translationService) {
        this.name = 'i18n';
        this.translationService = translationService;
    }

    /**
     * Handlebars callback function.
     * Example:
     *  Translation: { "pageOf": "Page {{current}} of {{max}}" }
     *  Template: Page: {{i18n 'pageOf' current=currentPage max=42}}
     *  -> Where data is { currentPage: 13 }
     * Result:
     *  key: 'pageOf'
     *  options: { hash: { current: 13, max: 42 } }
     *
     * @param {string} key
     * @param {hash: any} options
     */
    onExecute(key, options) {
        return this.translationService.translate(key, options.hash);
    }
}

let translationService = new TranslationService()
let handlebarsHelper = new HandlebarsHelper(translationService);

export {
    translationService as default,
    handlebarsHelper
};