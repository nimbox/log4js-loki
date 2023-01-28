import dotenv from 'dotenv';
import log4js from 'log4js';
import appender, { configuration } from '../src/index';

dotenv.config();

log4js.configure({
    appenders: {
        loki: { type: appender, ...configuration() },
        console: { type: 'console' }
    },
    categories: {
        default: {
            appenders: ['loki', 'console'],
            level: 'debug'
        }
    }
});


const logger = log4js.getLogger('log4js-loki');

logger.debug("This is a debug message");
logger.info("This is an info message");
logger.error("This is an error message");
