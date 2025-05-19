import {StoreGetAsyncStore} from "./async.storage";
import {ErrorsOr, isErrors} from "@lenscape/errors";
import {NameAnd} from "@lenscape/records";
import {AxiosInstance, AxiosRequestConfig, AxiosStatic} from "axios";

export type AsyncStoreConfig<Id, Data> = {
    axios: AxiosStatic | AxiosInstance;
    notFoundDetection?: (statusCode: number, body: string) => boolean;
    errorDetection?: (statusCode: number, body: string) => boolean;
    validateId?: (id: Id) => string[];
    defaultValue: (id: Id) => Promise<Data>;
    save: {
        url: (id: Id, d: Data) => string;
        method: string;
        headers?: (id: Id, d: Data) => NameAnd<string>;
        body: (id: Id, d: Data) => ErrorsOr<string>;
    };
    load: {
        url: (id: Id) => string;
        method: string;
        headers?: (id: Id) => NameAnd<string>;
        body: (id: Id) => ErrorsOr<string>;
        parser: (s: string) => ErrorsOr<Data>;
    };
};

function defaultNotFoundDetection(status: number): boolean {
    return status === 404;
}

function defaultErrorDetection(status: number): boolean {
    return status < 200 || status >= 300;
}

async function performAxios(
    axiosClient: AxiosStatic | AxiosInstance,
    config: AxiosRequestConfig
): Promise<ErrorsOr<{ status: number;
    statusText: string;
    body: string }>> {
    try {
        const response = await axiosClient.request({
            ...config,
            responseType: 'text',
            validateStatus: () => true,
        } as any);
        return {
            value: {
                status: response.status,
                statusText: response.statusText,
                body: response.data,
            },
        };
    } catch (e: any) {
        return { errors: [`Axios exception (${config.method} ${config.url}): ${e.message || e}`] };
    }
}

export function apiAsyncStore<Id, Data>({
                                            axios,
                                            defaultValue,
                                            save,
                                            load,
                                            validateId,
                                            notFoundDetection = defaultNotFoundDetection,
                                            errorDetection = defaultErrorDetection,
                                        }: AsyncStoreConfig<Id, Data>): StoreGetAsyncStore<Id, Data> {
    return {
        store: async (id, t): Promise<ErrorsOr<void>> => {
            const errors = validateId?.(id) || [];
            if (errors.length > 0) return { errors };

            const url = save.url(id, t);
            const bodyResult = save.body(id, t);
            if (isErrors(bodyResult)) return bodyResult;

            const config: AxiosRequestConfig = {
                url,
                method: save.method.toUpperCase(),
                headers: save.headers?.(id, t),
                data: bodyResult.value,
            };

            const fetchResult = await performAxios(axios, config);
            if (isErrors(fetchResult)) return fetchResult;

            const { status, statusText, body: responseBody } = fetchResult.value;
            if (errorDetection(status, responseBody)) {
                return { errors: [`Network response was not ok (${status} ${statusText}). Response: ${responseBody}`] };
            }

            return { value: undefined };
        },

        get: async (id): Promise<ErrorsOr<Data>> => {
            const errors = validateId?.(id) || [];
            if (errors.length > 0) return { errors };

            const url = load.url(id);
            const bodyResult = load.body(id);
            if (isErrors(bodyResult)) return bodyResult;

            const config: AxiosRequestConfig = {
                url,
                method: load.method.toUpperCase(),
                headers: load.headers?.(id),
                data: load.method.toUpperCase() === 'GET' ? undefined : bodyResult.value,
            };

            const fetchResult = await performAxios(axios, config);
            if (isErrors(fetchResult)) return fetchResult;

            const { status, statusText, body: responseBody } = fetchResult.value;
            if (notFoundDetection(status, responseBody)) {
                const def = await defaultValue(id);
                return { value: def };
            }
            if (errorDetection(status, responseBody)) {
                return { errors: [`Network response was not ok (${status} ${statusText}). Response: ${responseBody}`] };
            }

            return load.parser(responseBody);
        },
    };
}

export function apiAsyncStoreWithAppend<Id, Child>(
    config: AsyncStoreConfig<Id, Child[]>
): StoreGetAsyncStore<Id, Child[]> & { append: (id: Id, t: Child) => Promise<ErrorsOr<void>> } {
    const baseStore = apiAsyncStore(config);

    return {
        ...baseStore,
        append: async (id, child): Promise<ErrorsOr<void>> => {
            const currentDataResult = await baseStore.get(id);
            if (isErrors(currentDataResult)) return currentDataResult;

            const currentData = currentDataResult.value || [];
            const updatedData = [...currentData, child];
            return baseStore.store(id, updatedData);
        },
    };
}