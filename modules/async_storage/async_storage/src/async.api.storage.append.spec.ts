import { ErrorsOr, errorsOrThrow, isErrors, isValue } from '@lenscape/errors';
import { AxiosStatic } from 'axios';
import { apiAsyncStoreWithAppend } from './async.api.storage';

interface Item { id: number; name: string; }
type Id = string;

describe('apiAsyncStoreWithAppend', () => {
    let mockAxios: { request: jest.Mock };
    let store: ReturnType<typeof apiAsyncStoreWithAppend<Id, Item>>;

    const defaultValue = jest.fn(async (_: Id): Promise<Item[]> => []);

    const saveConfig = {
        url: (id: Id, data: Item[]) => `/lists/${id}`,
        method: 'PUT',
        headers: () => ({ 'Content-Type': 'application/json' }),
        body: (_, data: Item[]) => ({ value: JSON.stringify(data) } as ErrorsOr<string>),
    };

    const loadConfig = {
        url: (id: Id) => `/lists/${id}`,
        method: 'GET',
        headers: () => ({ Accept: 'application/json' }),
        body: () => ({ value: '' } as ErrorsOr<string>),
        parser: (s: string) => {
            try {
                return { value: JSON.parse(s) };
            } catch {
                return { errors: ['Invalid JSON'] };
            }
        },
    };

    beforeEach(() => {
        mockAxios = { request: jest.fn() };
        store = apiAsyncStoreWithAppend<Id, Item>({
            axios: mockAxios as unknown as AxiosStatic,
            defaultValue,
            save: saveConfig,
            load: loadConfig,
            validateId: id => (id === '' ? ['Invalid id'] : []),
        });
        jest.clearAllMocks();
    });

    describe('append', () => {
        it('appends item to existing array', async () => {
            mockAxios.request
                .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: '[{"id":1,"name":"existing"}]' }) // get
                .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: '' }); // store

            const result = await store.append('myList', { id: 2, name: 'newItem' });
            expect(isValue(result)).toBe(true);

            expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
                method: 'PUT',
                url: '/lists/myList',
                data: JSON.stringify([{ id: 1, name: 'existing' }, { id: 2, name: 'newItem' }]),
            }));
        });

        it('handles empty default array when item not found', async () => {
            mockAxios.request
                .mockResolvedValueOnce({ status: 404, statusText: 'Not Found', data: '' }) // get returns not found
                .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: '' }); // store

            const result = await store.append('newList', { id: 1, name: 'firstItem' });
            expect(isValue(result)).toBe(true);

            expect(mockAxios.request).toHaveBeenCalledWith(expect.objectContaining({
                method: 'PUT',
                url: '/lists/newList',
                data: JSON.stringify([{ id: 1, name: 'firstItem' }]),
            }));
        });

        it('returns validation errors', async () => {
            const errors = errorsOrThrow(await store.append('', { id: 1, name: 'item' }));
            expect(errors).toEqual(['Invalid id']);
        });

        it('handles axios get failure', async () => {
            mockAxios.request.mockRejectedValue(new Error('network down'));
            const errors = errorsOrThrow(await store.append('id1', { id: 3, name: 'item' }));
            expect(errors).toEqual(['Axios exception (GET /lists/id1): network down']);
        });

        it('handles axios store failure after successful get', async () => {
            mockAxios.request
                .mockResolvedValueOnce({ status: 200, statusText: 'OK', data: '[{"id":1,"name":"existing"}]' }) // get
                .mockRejectedValueOnce(new Error('network error on store')); // store

            const errors = errorsOrThrow(await store.append('id1', { id: 2, name: 'newItem' }));
            expect(errors).toEqual(['Axios exception (PUT /lists/id1): network error on store']);
        });
    });
});