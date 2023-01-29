/**
 * Takes in a string of key-value pairs, where each pair is separated by a
 * comma, and each key and value within a pair are separated by a colon. For
 * example, the string "key1:value1,key2:value2,key3:value3" would be parsed
 * into an object with keys "key1", "key2", and "key3", and corresponding values
 * "value1", "value2", and "value3".
 *
 * @param {string} values - A string of key-value pairs separated by commas 
 * @returns {object} - An object with keys and values
 */
function parseKeyValueString(values: string): { [key: string]: string } {

    const result: { [key: string]: string } = {};

    if (values) {

        const pairs = values.split(',');
        for (const pair of pairs) {

            const [key, value] = pair.split(':');
            result[key] = value;

        }

    }

    return result;

}

/**
 * Create appender configuration from environment variables. This can be used to
 * configure the appender in this way:
 *
 * ```ts
 * import log4js from 'log4js';
 * import appender, { configuration } from 'log4js-loki';
 * 
 * log4js.configure({
 *     appenders: {
 *         loki: { type: appender, ...configuration() },
 *         console: { type: 'console' }
 *     },
 *     categories: {
 *         default: {
 *             appenders: ['loki', 'console'],
 *             level: 'debug'
 *         }
 *     }
 * });
 * ```
 *
 * @returns 
 */
export const configuration = () => {

    return ({

        url: process.env['LOG4JS_LOKI_URL'] || null,
        token: process.env['LOG4JS_LOKI_TOKEN'] || null,
        username: process.env['LOG4JS_LOKI_USERNAME'] || null,
        password: process.env['LOG4JS_LOKI_PASSWORD'] || null,

        labels: parseKeyValueString(process.env['LOG4JS_LOKI_LABELS'] || ''),

        batch: process.env['LOG4JS_LOKI_BATCH'] != null ? process.env['LOG4JS_LOKI_BATCH'] === 'true' : true,
        batchSize: process.env['LOG4JS_LOKI_BATCH_SIZE'] != null ? parseInt(process.env['LOG4JS_LOKI_BATCH_SIZE']) : null,
        batchTimeout: process.env['LOG4JS_LOKI_BATCH_TIMEOUT'] != null ? parseInt(process.env['LOG4JS_LOKI_BATCH_TIMEOUT']) : null

    });

};
