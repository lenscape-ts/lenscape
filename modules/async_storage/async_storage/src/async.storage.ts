import {ErrorsOr} from "@lenscape/errors";

export type AppendAsyncStore<Id, Child> = {
    append: (id: Id, t: Child) => Promise<ErrorsOr<void>>;
}

export type StoreGetAsyncStore<Id, T>={
    store: (id: Id, t: T) => Promise<ErrorsOr<void>>
    get: (id: Id) => Promise<ErrorsOr<T | null>>
}
/** gets and stores information in a key-value store. The promise should NOT reject but instead use ErrorsOr. The client can rely on this (failures will be panics)*/
export type AsyncStore<Id, T> = StoreGetAsyncStore<Id, T> & (T extends Array<infer Child> ? AppendAsyncStore<Id, Child> : {});
