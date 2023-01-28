# @nimbox/log4js-loki

A log4js appender for sending logs to Loki, a log aggregation system by Grafana.

## Installation

```bash
npm install @nimbox/log4js-loki --save
```

## Usage

1. Import the appender and configuration function:

```ts
import log4js from 'log4js';
import appender, { configuration } from '@nimbox/log4js-loki';
```

2. Configure log4js to use the appender:

```ts
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
```

3. Set environment variables for connecting to your Loki instance.

```env
LOG4JS_LOKI_URL=http://loki:3100
LOG4JS_LOKI_USERNAME=<username>
LOG4JS_LOKI_PASSWORD=<password>
```

If no url is provided, the appender will default to not sending logs.

## Configuration

The configuration function `configuration()` retrieves the following
configuration options from environment variables:

* **`LOG4JS_LOKI_URL`** (required): The URL of your Loki instance.
* **`LOG4JS_LOKI_USERNAME`** (required): The username for basic auth.
* **`LOG4JS_LOKI_PASSWORD`** (required): The password for basic auth.
* **`LOG4JS_LOKI_LABELS`** (optional): A comma-separated string of
  key-value pairs to add as labels to your logs.
* **`LOG4JS_LOKI_BATCH`** (optional, default: `true`): Whether to
  batch logs before sending to Loki.
* **`LOG4JS_LOKI_BATCH_SIZE`** (optional, default: `10`): The number
  of logs to keep in a batch before sending.
* **`LOG4JS_LOKI_BATCH_TIMEOUT`** (optional, default: `2000`): The
  time in milliseconds before sending a batch of logs, even if the
  batch is not full.

## Example

```ts
import log4js from 'log4js';
import appender, { configuration } from '@nimbox/log4js-loki';

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

const logger = log4js.getLogger();
logger.debug("This is a debug message");
logger.info("This is an info message");
logger.error("This is an error message");
```

## Support

Please open an issue if you encounter any problems or have any suggestions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.