import {InMemoryAppendGetAsyncStore} from "./in.memory.append.get.async.store";
import {errorsOrThrow, valueOrThrow} from "@lenscape/errors";
import {AppendAndGetAsyncStore} from "./async.storage";

describe('InMemoryEventAsyncStore', () => {
    type Event = { type: string; payload?: any };
    let store: AppendAndGetAsyncStore<string, any>

    beforeEach(() => {
        store = new InMemoryAppendGetAsyncStore();
    });

    test('appending and getting events', async () => {
        const id = 'user1';
        const event1 = {type: 'Created', payload: {name: 'Alice'}};
        const event2 = {type: 'Updated', payload: {name: 'Alice Smith'}};

        await store.append(id, event1);
        await store.append(id, event2);

        const result = await store.get(id);
        expect(valueOrThrow(result)).toEqual([event1, event2]);
    });

    test('getting events for unknown id fails', async () => {
        const unknownId = 'unknown_user';
        //put some ids in
        await store.append('id1', {type: 'Created', payload: {name: 'Alice'}});
        await store.append('id2', {type: 'Created', payload: {name: 'Bob'}});
        const result = await store.get(unknownId);

        expect(errorsOrThrow(result)).toEqual([
            "Cannot find events for id unknown_user. Legal ids are id1,id2"
        ]);
    });


});
