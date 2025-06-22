import {ErrorsOr} from "@lenscape/errors";
import {AppendAndGetAsyncStore, StoreAsyncStore} from "./async.storage";

export class InMemoryAppendGetAsyncStore<Id, T> implements AppendAndGetAsyncStore<Id, T>, StoreAsyncStore<Id, T[]> {
    private cache: Map<Id, T[]> = new Map();

    async append(id: Id, event: T): Promise<ErrorsOr<void>> {
        const events = this.cache.get(id) || [];
        events.push(event);
        this.cache.set(id, events);
        return {value: undefined};
    }

    async get(id: Id): Promise<ErrorsOr<T[]>> {
        const events = this.cache.get(id)
        if (!events) return {errors: [`Cannot find events for id ${id}. Legal ids are ${[...this.cache.keys()].sort()}`]};
        return {value: events};
    }

    async store(id: Id, events: T[]): Promise<ErrorsOr<void>> {
        this.cache.set(id, events);
        return {value: undefined};
    }
}

