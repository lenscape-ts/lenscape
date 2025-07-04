import {LogOptionInResult, LogOptions, normaliseLogOptions} from "./log.options";

describe('normaliseLogOptions', () => {
    it('returns an empty array if input is undefined', () => {
        expect(normaliseLogOptions(undefined)).toEqual([]);
    });

    it('normalises a single string input', () => {
        expect(normaliseLogOptions('event occurred')).toEqual([
            {whatHappened: 'event occurred', severity: 'info', params: []},
        ]);
    });

    it('normalises a single object input with defaults', () => {
        const input: LogOptions = {whatHappened: 'action taken'};
        expect(normaliseLogOptions(input)).toEqual([
            {whatHappened: 'action taken', severity: 'info', params: []},
        ]);
    });

    it('normalises a single object input with severity and params', () => {
        const input: LogOptionInResult = {
            whatHappened: 'database error',
            severity: 'error',
            params: ['DB_TIMEOUT'],
        };
        expect(normaliseLogOptions(input)).toEqual([
            {whatHappened: 'database error', severity: 'error', params: ['DB_TIMEOUT']},
        ]);
    });

    it('normalises mixed array inputs', () => {
        const input: LogOptionInResult = [
            'initialised',
            {whatHappened: 'fetch successful', severity: 'debug'},
            {whatHappened: 'unexpected input', params: ['NaN']},
        ];

        expect(normaliseLogOptions(input)).toEqual([
            {whatHappened: 'initialised', severity: 'info', params: []},
            {whatHappened: 'fetch successful', severity: 'debug', params: []},
            {whatHappened: 'unexpected input', severity: 'info', params: ['NaN']},
        ]);
    });
});
