import {InMemoryGetStoreAsyncStore} from "./in.memory.get.store.async.store";
import {errorsOrThrow, valueOrThrow} from "@lenscape/errors";
import {AsyncStore} from "./async.storage";

describe('InMemoryGetStoreAsyncStore', () => {
    type Data = { name: string };
    let store: AsyncStore<string, any>

    beforeEach(() => {
        store = new InMemoryGetStoreAsyncStore();
    });

    test('stores and retrieves values correctly', async () => {
        const id = 'item1';
        const data: Data = {name: 'Alice'};

        await store.store(id, data);
        const result = await store.get(id);

        expect(valueOrThrow(result)).toEqual(data);
    });

    test('get returns error if id not found', async () => {
        const unknownId = 'unknown_item';
        const result = await store.get(unknownId);

        expect(errorsOrThrow(result)![0]).toContain(`Cannot find value for id ${unknownId}`);
    });

    test('store overwrites existing values', async () => {
        const id = 'item2';
        const data1: Data = {name: 'Bob'};
        const data2: Data = {name: 'Robert'};

        await store.store(id, data1);
        expect(valueOrThrow(await store.get(id))).toEqual(data1);

        await store.store(id, data2);
        expect(valueOrThrow(await store.get(id))).toEqual(data2);
    });
});
