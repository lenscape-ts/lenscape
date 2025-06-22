import {getAllValuesFromIds, InterpreterFn, InterpreterPlugIn} from '@lenscape/interpreter'
import {GetAsyncStore} from "@lenscape/async_storage";
import {flatMapErrorsOrK} from "@lenscape/errors";
import {AppendIdEvent, BaseEvent, EventType, InfoEvent, SetIdEvent, SetValueEvent, ZeroEvent} from "@lenscape/events";
import {lensFromPath, mapLens} from "@lenscape/lens";


export type EventProcessor<Event extends BaseEvent> = (e: Event, acc: any, idsToValue: Map<string, any>) => any
export type EventProcessors = Record<EventType, EventProcessor<any>>

export const zeroEp: EventProcessor<ZeroEvent> = () =>
    ({})

export const noopEp: EventProcessor<InfoEvent> = (e, acc) =>
    acc

export const setValueEp: EventProcessor<SetValueEvent> = (e, acc) =>
    lensFromPath(e.path).set(acc, e.value)

export const setIdEp: EventProcessor<SetIdEvent> = (e, acc, idsToValue) =>
    lensFromPath(e.path).set(acc, idsToValue.get(e.id))

export const appendValueEp: EventProcessor<SetValueEvent> = (e, acc) =>
    mapLens<any, any[]>(lensFromPath(e.path), old =>
        [...old, e.value])(acc);

export const appendIdEp: EventProcessor<AppendIdEvent> = (e, acc, idsToValue) =>
    mapLens<any, any[]>(lensFromPath(e.path), old =>
        [...old, idsToValue.get(e.id)])(acc);


export const eventProcessors: EventProcessors = {
    'zero': zeroEp,
    'info': noopEp,
    'error': noopEp,
    'setValue': setValueEp,
    'setId': setIdEp,
    'appendValue': appendValueEp,
    'appendId': appendIdEp,
}

export function processOneEvent(eps: EventProcessors, id2Values: Map<string, any>, e: BaseEvent, acc: any): any {
    const ep = eps[e.event]
    if (ep) {
        return ep(e, acc, id2Values)
    } else {
        throw new Error(`No event processor for ${e.event}\n${JSON.stringify(e)}`)
    }
}

export const jsonInterpreterFn = (storeForIds: GetAsyncStore<string, any>, _eventProcessors: EventProcessors = eventProcessors): InterpreterFn<any> =>
    async (events, initial) =>
        flatMapErrorsOrK(await getAllValuesFromIds(storeForIds, events), async idToValues =>
            ({
                value: events.reduce((acc, e) => {
                    const result = processOneEvent(_eventProcessors, idToValues, e, acc);
                    return result;
                }, initial)
            }))

export function JsonInterpreterPlugIn(storeForIds: GetAsyncStore<string, any>, _eventProcessors: EventProcessors = eventProcessors): InterpreterPlugIn<any> {
    return {
        plugin: 'interpreter',
        name: 'json',
        description: `Json interpreter: the 'natural' meaning of events`,
        initial: {},
        execute: jsonInterpreterFn(storeForIds, _eventProcessors),
    }
}