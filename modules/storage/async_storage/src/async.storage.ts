import {ErrorsOr} from "@lenscape/errors";

export type AsyncStore<Id, T> = {
    store: (id: Id, t: T) => Promise<ErrorsOr<void>>
    get: (id: Id) => Promise<ErrorsOr<T>>
}