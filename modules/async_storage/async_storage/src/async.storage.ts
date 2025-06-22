import {ErrorsOr} from "@lenscape/errors";

export type AppendAsyncStore<Id, Child> = {
    append: (id: Id, t: Child) => Promise<ErrorsOr<void>>;
}

/** The contract is that this might return a default T or errors when id doesn't exist. That is implementation specific */
export type GetAsyncStore<Id, T> = {
    get: (id: Id) => Promise<ErrorsOr<T>>
}

export type StoreAsyncStore<Id, T> = {
    store: (id: Id, t: T) => Promise<ErrorsOr<void>>
}

export type StoreGetAsyncStore<Id, T> = GetAsyncStore<Id, T> & StoreAsyncStore<Id, T>

export type AsyncStore<Id, T> = StoreGetAsyncStore<Id, T> & (T extends Array<infer Child> ? AppendAsyncStore<Id, Child> : {});

export type AppendAndGetAsyncStore<Id, T> = GetAsyncStore<Id, T[]> & AppendAsyncStore<Id, T>