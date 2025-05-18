export interface IStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    type: string;
}

export const mapStorageImplementation = (): IStorage => {
    const store = new Map<string, string>();
    return {
        type: "mapStorage",
        getItem: (key: string): string | null => store.has(key) ? store.get(key)! : null,
        setItem: (key: string, value: string): void => {
            store.set(key, value);
        },
        removeItem: (key: string): void => {
            store.delete(key);
        },
    };

};

// --- Detection Function ---
// Writes a random value to a test key, checks if it can read it back correctly, and then removes it.
export const isStorageWorking = (storage: IStorage): boolean => {
    const testKey = "__storage_test__";
    const testValue = Math.random().toString();
    try {
        storage.setItem(testKey, testValue);
        const working = storage.getItem(testKey) === testValue;
        storage.removeItem(testKey);
        return working;
    } catch (e) {
        return false;
    }
};

export const findWorkingStorage = (candidates: IStorage[]): IStorage => {
    for (const candidate of candidates) {
        if (isStorageWorking(candidate)) return candidate;
    }
    return mapStorageImplementation();
};

