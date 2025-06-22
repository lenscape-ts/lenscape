import {flatMapErrorsOrK} from "@lenscape/errors";
import {AppendAndGetAsyncStore} from "@lenscape/async_storage";
import {LensEvent} from "@lenscape/events";
import {InterpreterFn} from "@lenscape/interpreter";
import {EventStore} from "./event.storage";

export type EventAsyncStore<Id> = AppendAndGetAsyncStore<Id, LensEvent>

export type AsyncEventStoreConfig<Id, T> = {
    asyncStore: EventAsyncStore<Id>
    interpreter: InterpreterFn<T>
    id: Id
    initial?: T
}


export function asyncEventStore<Id, T>({id, asyncStore, interpreter, initial = {} as T}: AsyncEventStoreConfig<Id, T>): EventStore<T> {
    let initialEvents = asyncStore.get(id)
    let currentValue = initialEvents.then(async eventsOrError =>
        flatMapErrorsOrK(eventsOrError, es => interpreter(es, initial)))
    const change = async (event: LensEvent) => {
        currentValue = flatMapErrorsOrK(await currentValue, acc => interpreter([event], acc))
        asyncStore.append(id, event)
        return currentValue
    }
    return {get: () => currentValue, change, rawEvents: () => asyncStore.get(id)}
}
