import {getAllValuesFromIds, InterpreterFn} from '@lenscape/interpreter'
import {AsyncStore} from "@lenscape/async_storage";
import {flatMapErrorsOrK} from "@lenscape/errors";
import {AppendIdEvent, BaseEvent, ErrorEvent, EventType, InfoEvent, SetIdEvent, SetValueEvent, ZeroEvent} from "@lenscape/events";
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

export const appendEp: EventProcessor<SetValueEvent> = (e, acc) =>
    mapLens<any, any[]>(lensFromPath(e.path), old => [...old, e.value])(acc);

export const appendIdEp: EventProcessor<AppendIdEvent> = (e, acc, idsToValue) =>
    mapLens<any, any[]>(lensFromPath(e.path), old => [...old, idsToValue.get(e.id)])(acc);

export const errorEp: EventProcessor<ErrorEvent> = (e, acc) => {
    throw new Error('Should not call error events.')
}
export const eventProcessors: EventProcessors = {
    'zero': zeroEp,
    'info': noopEp,
    'error': errorEp,
    'setValue': setValueEp,
    'setId': setIdEp,
    'appendId': appendEp,
    'appendValue': appendIdEp,
}

export function processOneEvent(eps: EventProcessors, id2Values: Map<string, any>, e: BaseEvent, acc: any): any {
    const ep = eps[e.event]
    if (ep) {
        return ep(e, acc, id2Values)
    } else {
        throw new Error(`No event processor for ${e.event}\n${JSON.stringify(e)}`)
    }
}

export const jsonInterpreterFn = (asyncStore: AsyncStore<string, any>): InterpreterFn<any> =>
    async (events, initial) =>
        flatMapErrorsOrK(await getAllValuesFromIds(asyncStore, events), async idToValues => {

        })
