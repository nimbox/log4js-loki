import log4js from 'log4js';
import appender from '../src/appender';
import { configuration } from '../src/configuration';
import dotenv from 'dotenv';
import axios from 'axios';


// 
// Configuration
//

jest.setTimeout(30000);

jest.mock('axios');
const mockPost = jest.fn();
jest.spyOn(axios, 'create').mockReturnValue(axios);
jest.spyOn(axios, 'post').mockImplementation(mockPost);
jest.spyOn(axios, 'isCancel').mockImplementation((error: any) => error.__CANCEL__);

//
// Setup
//

const _logger = log4js.getLogger('test');

beforeEach(() => {

    dotenv.config({ path: '.env.one.test' });

    log4js.configure({
        appenders: { loki: { type: appender, ...configuration() } },
        categories: { default: { appenders: ['loki'], level: 'debug' } }
    });

});

const shutdown = async () => {
    try {
        await new Promise((resolve, reject) => { log4js.shutdown(resolve); });
    } catch (error) {
    }
};

afterEach(async () => {
    await shutdown();
});

//
// Tests
//

const responseResolve = (config: any, delay: number, onResolve: () => void, onAbort: () => void) =>
    new Promise((resolve, reject) => {

        const timeout = setTimeout(() => {

            config.signal.removeEventListener('abort', handleAbort);

            onResolve();
            resolve({ status: 200, statusText: 'OK' });

        }, delay);

        config.signal.addEventListener('abort', handleAbort);

        function handleAbort() {

            clearTimeout(timeout);
            config.signal.removeEventListener('abort', handleAbort);

            onAbort();
            reject({ __CANCEL__: true });

        }

    });

test("log 1 message", async () => {

    const onResolve = jest.fn();
    const onAbort = jest.fn();

    mockPost.mockImplementationOnce(async (url, data, config) => {

        expect(url).toBe('');

        expect(data.streams.length).toEqual(1);
        expect(data.streams[0].stream).toEqual({ instance: 'testing', category: 'test', level: 'INFO' });
        expect(data.streams[0].values.length).toEqual(1);
        expect(data.streams[0].values[0].length).toEqual(2);
        expect(data.streams[0].values[0][1]).toEqual('hello world');

        return responseResolve(config, 0, onResolve, onAbort);

    });

    _logger.info('hello world');

    await shutdown();
    expect(onResolve).toHaveBeenCalled();
    expect(onAbort).not.toHaveBeenCalled();

});

test("log 1 message delayed", async () => {

    const onResolve = jest.fn();
    const onAbort = jest.fn();

    mockPost.mockImplementationOnce(async (url, data, config) => {

        expect(url).toBe('');

        expect(data.streams.length).toEqual(1);
        expect(data.streams[0].stream).toEqual({ instance: 'testing', category: 'test', level: 'INFO' });
        expect(data.streams[0].values.length).toEqual(1);
        expect(data.streams[0].values[0].length).toEqual(2);
        expect(data.streams[0].values[0][1]).toEqual('hello world');

        return responseResolve(config, 4000, onResolve, onAbort);

    });

    _logger.info('hello world');

    await shutdown();
    expect(onResolve).not.toHaveBeenCalled();
    expect(onAbort).toHaveBeenCalled();

});

test("log count + 1 messages", async () => {

    const onResolve = jest.fn();
    const onAbort = jest.fn();

    mockPost.mockImplementation(async (url, data, config) => {
        expect(data.streams.length).toEqual(1);
        return responseResolve(config, 0, onResolve, onAbort);
    });

    for (let i = 0; i < 3; i++) {
        _logger.info('hello world');
    }

    await shutdown();
    expect(onResolve).toHaveBeenCalledTimes(3);
    expect(onAbort).not.toHaveBeenCalled();

});

test("log count + 1 messages delayed", async () => {

    const onResolve = jest.fn();
    const onAbort = jest.fn();

    mockPost.mockImplementation(async (url, data, config) => {
        expect(data.streams.length).toEqual(1);
        return responseResolve(config, 4000, onResolve, onAbort);
    });

    for (let i = 0; i < 3; i++) {
        _logger.info('hello world');
    }

    await shutdown();
    expect(onResolve).not.toHaveBeenCalled();
    expect(onAbort).toHaveBeenCalledTimes(3);

});
