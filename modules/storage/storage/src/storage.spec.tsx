import { mapStorageImplementation, isStorageWorking, findWorkingStorage, IStorage } from './storage';

describe('mapStorageImplementation', () => {
    let storage: IStorage;

    beforeEach(() => {
        storage = mapStorageImplementation();
    });

    it('initially returns null for any key', () => {
        expect(storage.getItem('foo')).toBeNull();
    });

    it('stores and retrieves a value', () => {
        storage.setItem('foo', 'bar');
        expect(storage.getItem('foo')).toEqual('bar');
    });

    it('removes a value', () => {
        storage.setItem('foo', 'bar');
        expect(storage.getItem('foo')).toEqual('bar');
        storage.removeItem('foo');
        expect(storage.getItem('foo')).toBeNull();
    });
});

describe('isStorageWorking', () => {
    it('returns true for a working storage', () => {
        const storage = mapStorageImplementation();
        expect(isStorageWorking(storage)).toBe(true);
    });

    it('returns false if storage throws on setItem', () => {
        const badStorage: IStorage = {
            type: 'bad',
            getItem: () => null,
            setItem: () => { throw new Error('fail'); },
            removeItem: () => undefined,
        };
        expect(isStorageWorking(badStorage)).toBe(false);
    });

    it('returns false if storage returns wrong value', () => {
        // storage that echoes a different value
        const lameStorage: IStorage = {
            type: 'lame',
            getItem: () => 'wrong',
            setItem: () => {},
            removeItem: () => {},
        };
        expect(isStorageWorking(lameStorage)).toBe(false);
    });
});

describe('findWorkingStorage', () => {
    it('selects the first working storage', () => {
        const broken: IStorage = {
            type: 'broken',
            getItem: () => null,
            setItem: () => { throw new Error('fail'); },
            removeItem: () => {},
        };
        const good = mapStorageImplementation();
        const candidate = findWorkingStorage([broken, good]);
        expect(candidate.type).toEqual('mapStorage');
    });

    it('falls back to map storage if none work', () => {
        const bad1: IStorage = {
            type: 'b1',
            getItem: () => null,
            setItem: () => { throw new Error(); },
            removeItem: () => {},
        };
        const bad2: IStorage = {
            type: 'b2',
            getItem: () => 'wrong',
            setItem: () => {},
            removeItem: () => {},
        };
        const candidate = findWorkingStorage([bad1, bad2]);
        expect(candidate.type).toEqual('mapStorage');
        // The returned storage should work
        expect(isStorageWorking(candidate)).toBe(true);
    });
});
