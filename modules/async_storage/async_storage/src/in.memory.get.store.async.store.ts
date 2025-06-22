import {ErrorsOr} from "@lenscape/errors";
import {GetAsyncStore, StoreAsyncStore} from "./async.storage";
import {NameAnd} from "@lenscape/records";

export class InMemoryGetStoreAsyncStore<Id, T> implements GetAsyncStore<Id, T>, StoreAsyncStore<Id, T> {
    private cache: Map<Id, T> = new Map();



    async get(id: Id): Promise<ErrorsOr<T>> {
        const value = this.cache.get(id)
        if (!value) return {errors: [`Cannot find value for id ${id}. Legal ids are ${[...this.cache.keys()].sort()}`]};
        return {value: value};
    }

    async store(id: Id, valye: T): Promise<ErrorsOr<void>> {
        this.cache.set(id, valye);
        return {value: undefined};
    }
}

