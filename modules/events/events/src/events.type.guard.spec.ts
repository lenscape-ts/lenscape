// events.test.ts
import {
    ZeroEvent,
    InfoEvent,
    ErrorEvent,
    SetIdEvent,
    AppendIdEvent,
    SetValueEvent,
    AppendValueEvent,
    isZeroEvent,
    isInfoEvent,
    isErrorEvent,
    isSetIdEvent,
    isAppendIdEvent,
    isSetValueEvent,
    isAppendValueEvent, isIdEvent,
} from './events'

const zeroEvent: ZeroEvent = {
    event: 'zero',
    metadata: {actor: 'tester'}
}

const infoEvent: InfoEvent = {
    event: 'info',
    metadata: {actor: 'tester'},
    info: 'some-debug-info'
}

const errorEvent: ErrorEvent = {
    event: 'error',
    metadata: {actor: 'tester'},
    error: 'something went wrong',
    from: new Error('original')
}

const setIdEvent: SetIdEvent = {
    event: 'setId',
    metadata: {actor: 'tester'},
    path: '/foo/bar',
    id: 'blob-123',
}

const appendIdEvent: AppendIdEvent = {
    event: 'appendId',
    metadata: {actor: 'tester'},
    path: '/foo/bar',
    id: 'blob-456'
}

const setValueEvent: SetValueEvent = {
    event: 'setValue',
    metadata: {actor: 'tester'},
    path: '/foo/bar',
    value: {hello: 'world'}
}

const appendValueEvent: AppendValueEvent = {
    event: 'appendValue',
    metadata: {actor: 'tester'},
    path: '/foo/bar',
    value: 42
}

const allEvents = [
    zeroEvent,
    infoEvent,
    errorEvent,
    setIdEvent,
    appendIdEvent,
    setValueEvent,
    appendValueEvent,
]

describe('Event type-guards', () => {
    test('isZeroEvent', () => {
        expect(allEvents.map(isZeroEvent)).toEqual([
            /* zeroEvent */    true,
            /* infoEvent */    false,
            /* errorEvent */   false,
            /* setIdEvent */   false,
            /* appendIdEvent */false,
            /* setValueEvent */false,
            /* appendValueEvent */false,
        ])
    })

    test('isInfoEvent', () => {
        expect(allEvents.map(isInfoEvent)).toEqual([
            false, /* zeroEvent */
            true,  /* infoEvent */
            false,
            false,
            false,
            false,
            false,
        ])
    })

    test('isErrorEvent', () => {
        expect(allEvents.map(isErrorEvent)).toEqual([
            false,
            false,
            true,
            false,
            false,
            false,
            false,
        ])
    })

    test('isSetIdEvent', () => {
        expect(allEvents.map(isSetIdEvent)).toEqual([
            false,
            false,
            false,
            true,
            false,
            false,
            false,
        ])
    })

    test('isAppendIdEvent', () => {
        expect(allEvents.map(isAppendIdEvent)).toEqual([
            false,
            false,
            false,
            false,
            true,
            false,
            false,
        ])
    })

    test('isSetValueEvent', () => {
        expect(allEvents.map(isSetValueEvent)).toEqual([
            false,
            false,
            false,
            false,
            false,
            true,
            false,
        ])
    })

    test('isAppendValueEvent', () => {
        expect(allEvents.map(isAppendValueEvent)).toEqual([
            false,
            false,
            false,
            false,
            false,
            false,
            true,
        ])
    })


    test('isIdEvent', () => {
        expect(allEvents.map(isIdEvent)).toEqual([
            false,
            false,
            false,
            true,
            true,
            false,
            false
        ])
    })
})
