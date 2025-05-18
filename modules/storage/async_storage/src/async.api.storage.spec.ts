import {ErrorsOr, errorsOrThrow, isErrors, isValue} from '@lenscape/errors';
import {AxiosStatic} from 'axios';
import {apiAsyncStore} from "./async.api.storage";

interface Data { foo: string; }
type Id = string;

describe('apiAsyncStore (Axios variant)', () => {
    let mockAxios: { request: jest.Mock };
    let store: ReturnType<typeof apiAsyncStore<Id, Data>>;
    const defaultValue = jest.fn(async (id: Id): Promise<Data> => ({ foo: 'default' }));

    const saveConfig = {
        url: (id: Id, d: Data) => `/items/${id}`,
        method: 'POST',
        headers: (id: Id, d: Data) => ({ 'Content-Type': 'application/json' }),
        body: (id: Id, d: Data) => ({ value: JSON.stringify(d) } as ErrorsOr<string>),
    };

    const loadConfig = {
        url: (id: Id) => `/items/${id}`,
        method: 'GET',
        headers: (id: Id) => ({ Accept: 'application/json' }),
        body: (_: Id) => ({ value: '' } as ErrorsOr<string>),
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
        store = apiAsyncStore<Id, Data>({
            axios: mockAxios as unknown as AxiosStatic,
            defaultValue,
            save: saveConfig,
            load: loadConfig,
            validateId: id => (id === '' ? ['Invalid id'] : []),
        });
        jest.clearAllMocks();
    });

    describe('store', () => {
        it('returns validation errors', async () => {
            const errors = errorsOrThrow(await store.store('', { foo: 'bar' }));
            expect(errors).toEqual(['Invalid id']);
        });

        it('returns body errors if save.body errs', async () => {
            const badSave = { ...saveConfig, body: () => ({ errors: ['body error'] } as ErrorsOr<string>) };
            const badStore = apiAsyncStore<Id, Data>({
                axios: mockAxios as unknown as AxiosStatic,
                defaultValue,
                save: badSave,
                load: loadConfig,
            });
            const errors = errorsOrThrow(await badStore.store('id1', { foo: 'bar' }));
            expect(errors).toEqual(['body error']);
        });

        it('handles axios exception', async () => {
            mockAxios.request.mockRejectedValue(new Error('network down'));
            const errors = errorsOrThrow(await store.store('id1', { foo: 'bar' }));
            expect(errors).toEqual(['Axios exception (POST /items/id1): network down']);
        });

        it('returns errorDetection failure', async () => {
            mockAxios.request.mockResolvedValue({ status: 500, statusText: 'Server Error', data: 'Oops' });
            const errors = errorsOrThrow(await store.store('id1', { foo: 'bar' }));
            expect(errors).toEqual(['Network response was not ok (500 Server Error). Response: Oops']);
        });

        it('resolves successfully on 2xx', async () => {
            mockAxios.request.mockResolvedValue({ status: 201, statusText: 'Created', data: '' });
            const result = await store.store('id1', { foo: 'baz' });
            expect(isValue(result)).toEqual(true)
        });
    });

    describe('get', () => {
        it('returns validation errors', async () => {
            const errors = errorsOrThrow(await store.get(''));
            expect(errors).toEqual(['Invalid id']);
        });

        it('returns body errors if load.body errs', async () => {
            const badLoad = { ...loadConfig, body: () => ({ errors: ['body error'] } as ErrorsOr<string>) };
            const badStore = apiAsyncStore<Id, Data>({
                axios: mockAxios as unknown as AxiosStatic,
                defaultValue,
                save: saveConfig,
                load: badLoad,
            });
            const errors = errorsOrThrow(await badStore.get('id1'));
            expect(errors).toEqual(['body error']);
        });

        it('handles axios exception', async () => {
            mockAxios.request.mockRejectedValue(new Error('network down'));
            const errors = errorsOrThrow(await store.get('id1'));
            expect(errors).toEqual(['Axios exception (GET /items/id1): network down']);
        });

        it('returns defaultValue on 404', async () => {
            mockAxios.request.mockResolvedValue({ status: 404, statusText: 'Not Found', data: 'Not Found' });
            const result = await store.get('id1');
            expect(isErrors(result)).toBe(false);
            expect(defaultValue).toHaveBeenCalledWith('id1');
            expect((result as { value: Data }).value).toEqual({ foo: 'default' });
        });

        it('returns errorDetection failure', async () => {
            mockAxios.request.mockResolvedValue({ status: 500, statusText: 'Server Error', data: 'Oops' });
            const errors = errorsOrThrow(await store.get('id1'));
            expect(errors).toEqual(['Network response was not ok (500 Server Error). Response: Oops']);
        });

        it('parses data on success', async () => {
            const payload = JSON.stringify({ foo: 'bar' });
            mockAxios.request.mockResolvedValue({ status: 200, statusText: 'OK', data: payload });
            const result = await store.get('id1');
            expect(isErrors(result)).toBe(false);
            expect((result as { value: Data }).value).toEqual({ foo: 'bar' });
        });
    });
});
