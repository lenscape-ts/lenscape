import {findWorkingStorage, IStorage, mapStorageImplementation} from "@lenscape/storage";
import {makeContextFor} from "@lenscape/context";


export const localStorageImplementation: IStorage = {
    type: "localStorage",
    getItem: (key: string): string | null => localStorage.getItem(key),
    setItem: (key: string, value: string): void => localStorage.setItem(key, value),
    removeItem: (key: string): void => localStorage.removeItem(key),
};

export const sessionStorageImplementation: IStorage = {
    type: "sessionStorage",
    getItem: (key: string): string | null => sessionStorage.getItem(key),
    setItem: (key: string, value: string): void => sessionStorage.setItem(key, value),
    removeItem: (key: string): void => sessionStorage.removeItem(key),
};

export const cookieStorageImplementation: IStorage = {
    type: "cookieStorage",
    getItem: (key: string): string | null => {
        const regex = new RegExp("(?:^|; )" + encodeURIComponent(key) + "=([^;]*)");
        const match = document.cookie.match(regex);
        return match ? decodeURIComponent(match[1]) : null;
    },
    setItem: (key: string, value: string): void => {
        document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
    },
    removeItem: (key: string): void => {
        document.cookie = `${encodeURIComponent(key)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    },
};


export const defaultStorageCandidates: IStorage[] = [
    localStorageImplementation,
    sessionStorageImplementation,
    cookieStorageImplementation,
    mapStorageImplementation(),
];

export const workingStorage = findWorkingStorage(defaultStorageCandidates)

export const {
    use: useWorkingStorage,
    Provider: WorkingStorageProvider
} = makeContextFor('workingStorage', workingStorage);

