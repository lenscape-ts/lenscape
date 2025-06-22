import {ErrorsOr} from "@lenscape/errors";
import {BaseEvent} from "@lenscape/events";
import {AsyncState} from "@lenscape/async";

export type EventStoreChangeFn<T> = (e: BaseEvent) => Promise<ErrorsOr<T>>
export type EventStoreGetFn<T> = () => Promise<ErrorsOr<T>>
export type EventStoreRawEvents = () => Promise<ErrorsOr<BaseEvent[]>>

export type EventStore<T> = {
    change: EventStoreChangeFn<T>
    get: EventStoreGetFn<T>
    rawEvents: EventStoreRawEvents
}

export type AsyncStateEventStoreChangeFn<T> = (e: BaseEvent) => Promise<ErrorsOr<AsyncState<T>>>
export type AsyncStateEventStoreGetFn<T> = () => Promise<ErrorsOr<AsyncState<T>>>
export type AsyncStateEventStoreRawEvents = () => Promise<ErrorsOr<AsyncState<BaseEvent[]>>>

export type AsyncStateEventStore<T> = {
    change: AsyncStateEventStoreChangeFn<T>
    get: AsyncStateEventStoreGetFn<T>
    rawEvents: AsyncStateEventStoreRawEvents
}
