import {ErrorsOr, isErrors} from "@lenscape/errors";
import {CryptoConfig, CryptoMetadata, cryptoMetadataFromHeaders, CryptoMetadataFromHeaders, cryptoMetadataToHeaders, CryptoMetadataToHeadersFn, defaultStorageDecodeFn, defaultStorageEncodeFn, StorageDecodeFn, InitialStorageEncodeFn} from "@lenscape/storage_crypto";
import {AxiosResponse, AxiosStatic} from "axios";
import {StoreGetAsyncStore} from "@lenscape/async_storage";

export type AzureBlobStorageConfig = {
    accountName: string,
    containerName: string,
    sasToken: string,
    blobtype: string
    version: string
    blobNameFn: (id: string) => string
    axios: AxiosStatic
    _storageEncodeFn?: InitialStorageEncodeFn
    _storageDecodeFn?: StorageDecodeFn
    _cryptoMetadataToHeadersFn?: CryptoMetadataToHeadersFn
    _cryptoMetadataFromHeaders?: CryptoMetadataFromHeaders
}

function azureBlobUrl(azureConfig: AzureBlobStorageConfig, id: string) {
    const {accountName, containerName, blobNameFn, sasToken} = azureConfig;
    const blobName = blobNameFn(id);
    return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
}

export function azureBlobStore(azureConfig: AzureBlobStorageConfig, cryptoConfig: CryptoConfig) {
    const {
        axios, blobtype, version,
        _storageEncodeFn = defaultStorageEncodeFn,
        _cryptoMetadataToHeadersFn = cryptoMetadataToHeaders,

    } = azureConfig;
    return async (id: string, value: any): Promise<ErrorsOr<void>> => {
        const {encoded, metadata} = await _storageEncodeFn(cryptoConfig)(id, JSON.stringify(value))
        const cryptoHeaders = _cryptoMetadataToHeadersFn(metadata)
        const url = azureBlobUrl(azureConfig, id)
        const headers = {
            ...cryptoHeaders,
            'x-ms-blob-type': blobtype,
            'x-ms-version': version,
            'Content-Type': 'application/json; charset=utf-8'
        }
        try {
            const response = await axios.put(url, encoded, {headers, validateStatus: () => true})
            if (response.status >= 400) {
                console.error("Azure Blob PUT URL:", url, response.status, response.data);
                return {errors: [`Failed to store data in Azure Blob Storage: ${response.status} ${JSON.stringify(response.data)}`]};
            }
            return {value: undefined}
        } catch (e: any) {
            console.error("Error storing data in Azure Blob Storage:", url, e);
            return {errors: [`Error storing data in Azure Blob Storage: ${e.message}`], extras: e};
        }
    }
}

function makeHeadersFrom(response: AxiosResponse<any>) {
    const rawHeaders = response.headers as Record<string, string>;
    const metaHeaders: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawHeaders)) {
        const lowK = k.toLowerCase();
        if (lowK.startsWith("x-ms-meta-")) metaHeaders[lowK] = v;
    }
    return metaHeaders;
}

function azureBlobLoad<T>(azureConfig: AzureBlobStorageConfig, cryptoConfig: CryptoConfig): (id: string) => Promise<ErrorsOr<T>> {
    const {
        axios, version,
        _storageDecodeFn = defaultStorageDecodeFn,
        _cryptoMetadataFromHeaders = cryptoMetadataFromHeaders
    } = azureConfig
    const legalFingerPrints = Object.keys(cryptoConfig.secrets.globalSecrets)
    return async (id: string) => {
        const url = azureBlobUrl(azureConfig, id)

        try {
            // get raw ciphertext and all response headers
            const response = await axios.get(url, {
                responseType: "text",   // or 'arraybuffer' if you return binary
                validateStatus: () => true,
                headers: {'x-ms-version': version}
            });

            if (response.status >= 400)
                return {errors: [`Failed to load blob: ${response.status} ${JSON.stringify(response.data)}`]};

            // 1) extract only the x-ms-meta- headers into a simple map
            const metaHeaders = makeHeadersFrom(response);

            // 2) parse them back into your crypto metadata object
            const meta: ErrorsOr<CryptoMetadata> = _cryptoMetadataFromHeaders(metaHeaders, legalFingerPrints)
            if (isErrors(meta)) return meta

            // 3) decrypt / decode the payload
            const encoded = response.data as string;
            const plaintext = await _storageDecodeFn(cryptoConfig)(meta.value, {userId: id}, encoded);

            // 4) JSON.parse back into your original object
            const obj: T = JSON.parse(plaintext);
            return {value: obj};
        } catch (e: any) {
            return {errors: [`Error loading data from Azure Blob Storage: ${e.message}`,], extras: e,};
        }
    }
}

export function azureBlobStorage<T>(azureConfig: AzureBlobStorageConfig, cryptoConfig: CryptoConfig): StoreGetAsyncStore<string, T> {
    return {
        store: azureBlobStore(azureConfig, cryptoConfig),
        get: azureBlobLoad(azureConfig, cryptoConfig)
    }
}