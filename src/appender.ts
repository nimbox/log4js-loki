import axios, { AxiosResponse, CreateAxiosDefaults } from 'axios';
import { AppenderFunction, AppenderModule, LayoutFunction, LoggingEvent } from 'log4js';


/**
 * Parse and validate the configuration for the logger. Writes errors to the
 * console and sets reasonable default configuration.
 *
 * @param {Object} config - Configuration object for the logger.
 * @returns {Object} - Parsed and validated configuration.
 */
function parse(config: any) {

    let url = config.url;
    let token = config.token;
    let username = config.username;
    let password = config.password;

    if (!url) {
        url = null;
        console.error('The url is not configured for the loki appender. No logs will be sent.');
    }

    return {

        url,
        username,
        password,
        token,

        labels: config?.labels || {},

        batch: config?.batch || false,
        batchSize: config?.batchSize || 10,
        batchTimeout: config?.batchTimeout || 2500

    } as const;

}

/**
 * Creates and returns an appender function for logging events to a Loki
 * endpoint.
 *
 * @param {Object} config - Configuration object for the logger.
 * @param {LayoutFunction} layout - A layout function for formatting the logging
 * event.
 * @returns {AppenderFunction} - An appender function for logging events to a
 * Loki endpoint.
 */
function create(config: any, layout: LayoutFunction): AppenderFunction {

    // Configuration

    const configuration = parse(config);

    // State

    const enabled = configuration != null && configuration.url !== '';

    const pendingPromises: Promise<AxiosResponse<any, any>>[] = [];
    const controller = new AbortController();

    const streams: any[] = [];
    let time: [number, number] = process.hrtime();
    let timeout: NodeJS.Timeout;

    // Methods

    /**
     * Create the axios instance with the correct authentication.
     */
    const authentication: CreateAxiosDefaults = {};
    if (configuration.token) {
        authentication.headers = {
            'Authorization': `Bearer ${configuration.token}`
        };
    } else if (configuration.username && configuration.password) {
        authentication.auth = {
            username: configuration.username,
            password: configuration.password
        };
    }

    /**
     * Instantiate the axios instance with basic authorization. And a
     * 2000 milli second timeout. If the timeout is reached, the logs
     * are discarded an no attempt is done to retransmit them.
     */
    const instance = axios.create({
        baseURL: config.url,
        ...authentication,
        timeout: 2000
    });

    /**
     * Format the logging event to make it compatible with the loki http
     * endpoint.
     * 
     * @param {LoggingEvent} event - The logging event to be formatted.
     * @returns {Object} - Formatted event.
     */
    const message = (event: LoggingEvent) => ({
        stream: {
            ...configuration.labels,
            category: event.categoryName,
            level: event.level.levelStr
        },
        values: [[event.startTime.getTime().toString() + "000000", layout(event)]]
    });

    /**
     * Post the streams object as json to the loki endpoint.
     * 
     * @param {Object} streams - Object to be posted.
     */
    const postObject = (streams: object) => {

        const promise = instance.post('', streams, { signal: controller.signal });
        pendingPromises.push(promise);
        promise
            .then(response => null)
            .catch(error => {
                if (!axios.isCancel(error)) {
                    console.error('There was an error while posting in the loki appender', error);
                }
            })
            .finally(() => {
                const index = pendingPromises.indexOf(promise);
                if (index >= 0) {
                    pendingPromises.slice(index, 1);
                }
            });

    };

    /**
     * Post the streams array as an object to the loki endpoint. If there are no
     * streams in the array do nothing. Reset the sent streams and the time
     * sent.
     */
    const postStreams = () => {

        if (streams.length > 0) {
            postObject({ streams });
            streams.length = 0;
            time = process.hrtime();
        }

    };

    /**
     * Post a logging event. If batch is enabled, then queue the event until the
     * number of events is greater than batchCount or if the time since the last
     * post has been longer batchTimeout.
     *
     * @param {LoggingEvent} event - The logging event to be posted.
     */
    const appender = (event: LoggingEvent) => {

        if (enabled) {

            clearTimeout(timeout);
            streams.push(message(event));

            if (configuration.batch) {
                if (streams.length >= configuration.batchSize || process.hrtime(time)[0] >= configuration.batchTimeout) {
                    postStreams();
                } else {
                    timeout = setTimeout(postStreams, configuration.batchTimeout);
                }
            } else {
                postStreams();
            }

        }

    };

    /**
     * Post pending streams before shutting down. If posting the streams takes
     * longer than 3000 millis then cancel all pending posts. 
     *
     * @param {Function} done - Callback function to be called after shutting
     * down.
     */
    appender.shutdown = function (done: () => void) {

        clearTimeout(timeout);
        postStreams();

        let finallyTimeout: NodeJS.Timeout | null = null;
        const finallyPromise = new Promise((resolve, reject) => {
            finallyTimeout = setTimeout(() => reject(new Error('Timeout')), 3000);
        });

        Promise.race([Promise.all(pendingPromises), finallyPromise])
            .then((value) => { })
            .catch((error) => { })
            .finally(() => {

                // Cancel the pending axios requests.
                controller.abort();

                // Cancel the timeout.
                if (finallyTimeout) {
                    clearTimeout(finallyTimeout);
                }

                // Notify that the shutdown is complete.
                done();

            });

    };

    // Return the appender function.
    return appender;

}

/**
 * AppenderModule containing the `configure` function.
 * @module AppenderModule
 */
export default {

    /**
     * Configures the appender with the provided config and layouts.
     *
     * @function
     * @param {Object} config - The configuration options for the appender.
     * @param {Object} layouts - The available layouts for the appender.
     * @return {Object} - The configured appender object.
     */
    configure: function (config, layouts) {

        let layout = layouts?.messagePassThroughLayout;
        if (config.layout) {
            layout = layouts?.layout(config.layout.type, config.layout);
        }

        return create(config, layout!);

    }

} as AppenderModule;
