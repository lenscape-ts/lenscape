import {AxiosResponse, AxiosStatic} from "axios";
import {CryptoMetadataFromHeaders, CryptoMetadataToHeadersFn, StorageDecodeFn, StorageEncodeFn} from "@lenscape/storage_crypto";
import {azureBlobStorage, azureBlobStore} from "./azure.async.storage";
import {errorsOrThrow, valueOrThrow} from "@lenscape/errors";

describe('azureBlobStore.store with injectable helpers', () => {
    const configBase = {
        accountName: 'acct', containerName: 'cont', sasToken: 'sas',
        blobtype: 'BlockBlob', version: '2020-10-02', blobNameFn: (id: string) => `${id}.json`
    } as const;
    const cryptoConfig = {} as any;

    let axiosMock: Partial<AxiosStatic>;
    let encodeFn: jest.MockedFunction<StorageEncodeFn>;
    let encodeInvoke: jest.Mock;
    let metaFn: jest.MockedFunction<CryptoMetadataToHeadersFn>;
    let headersMock: Record<string, string>;

    beforeEach(() => {
        axiosMock = {put: jest.fn()};
        encodeInvoke = jest.fn().mockResolvedValue({encoded: 'payload-enc', metadata: {foo: 'bar'}});
        encodeFn = jest.fn().mockReturnValue(encodeInvoke) as any;
        headersMock = {'x-ms-meta-foo': 'bar'};
        metaFn = jest.fn().mockReturnValue(headersMock);
    });

    it('uploads successfully and yields void', async () => {
        (axiosMock.put as jest.Mock).mockResolvedValue({status: 201, data: {}});
        const storeFn = azureBlobStore({
            ...configBase,
            axios: axiosMock as AxiosStatic,
            _storageEncodeFn: encodeFn,
            _cryptoMetadataToHeadersFn: metaFn,
        }, cryptoConfig);

        // Using errorsOrThrow to extract or throw on error
        expect(valueOrThrow(await storeFn('id1', {a: 1}))).toEqual(undefined)

        // ensure encode and header fns were invoked correctly
        expect(encodeFn).toHaveBeenCalledWith(cryptoConfig);
        expect(encodeInvoke).toHaveBeenCalledWith('id1', JSON.stringify({a: 1}));
        expect(metaFn).toHaveBeenCalledWith({foo: 'bar'});

        const expectedUrl = `https://acct.blob.core.windows.net/cont/id1.json?sas`;
        expect(axiosMock.put).toHaveBeenCalledWith(
            expectedUrl,
            'payload-enc',
            expect.objectContaining({
                headers: {
                    ...headersMock,
                    'x-ms-blob-type': 'BlockBlob',
                    'x-ms-version': '2020-10-02',
                    'Content-Type': 'application/json; charset=utf-8',
                },
                validateStatus: expect.any(Function),
            })
        );
    });

    it('throws on HTTP error status codes', async () => {
        (axiosMock.put as jest.Mock).mockResolvedValue({status: 404, data: {err: 'nf'}});
        const storeFn = azureBlobStore({
            ...configBase,
            axios: axiosMock as AxiosStatic,
            _storageEncodeFn: encodeFn,
            _cryptoMetadataToHeadersFn: metaFn,
        }, cryptoConfig);

        expect(errorsOrThrow(await storeFn('id2', {b: 2})))
            .toEqual(["Failed to store data in Azure Blob Storage: 404 {\"err\":\"nf\"}"]);
    });

    it('catches axios exceptions', async () => {
        const err = new Error('network err');
        (axiosMock.put as jest.Mock).mockRejectedValue(err);
        const storeFn = azureBlobStore({
            ...configBase,
            axios: axiosMock as AxiosStatic,
            _storageEncodeFn: encodeFn,
            _cryptoMetadataToHeadersFn: metaFn,
        }, cryptoConfig);

        expect(errorsOrThrow(await storeFn('id3', {c: 3})))
            .toEqual(["Error storing data in Azure Blob Storage: network err"]);
    });
});


describe('azureBlobStorage.get with injectable helpers', () => {
    const configBase = {
        accountName: 'acct',
        containerName: 'cont',
        sasToken: 'sas',
        blobtype: 'BlockBlob',
        version: '2020-10-02',
        blobNameFn: (id: string) => `${id}.json`,
    } as const;
    const cryptoConfig = {secrets: {globalSecrets: {k: 'v'}}} as any;

    let axiosMock: Partial<AxiosStatic>;
    let decodeFn: jest.MockedFunction<StorageDecodeFn>;
    let decodeInvoke: jest.Mock;
    let metaFromFn: jest.MockedFunction<CryptoMetadataFromHeaders>;

    beforeEach(() => {
        axiosMock = {get: jest.fn()};
        // storageDecodeFn returns plaintext JSON
        decodeInvoke = jest
            .fn()
            .mockResolvedValue(JSON.stringify({x: 42}));
        decodeFn = jest.fn().mockReturnValue(decodeInvoke) as any;
        // cryptoMetadataFromHeaders returns ErrorsOr<CryptoMetadata>
        metaFromFn = jest
            .fn()
            .mockReturnValue({value: {foo: 'bar'}} as any);
    });

    it('loads successfully and returns parsed object', async () => {
        // mock axios.get successful response
        const fakeResponse: Partial<AxiosResponse> = {
            status: 200,
            data: 'ciphertext',
            headers: {'x-ms-meta-foo': 'bar'},
        };
        (axiosMock.get as jest.Mock).mockResolvedValue(fakeResponse);

        const {get} = azureBlobStorage(
            {
                ...configBase,
                axios: axiosMock as AxiosStatic,
                _storageDecodeFn: decodeFn,
                _cryptoMetadataFromHeaders: metaFromFn,
            },
            cryptoConfig
        );

        // unwrap or throw
        const result = valueOrThrow(await get('id1'));

        // decodeFn invoked with (metadata, context, encoded)
        expect(metaFromFn).toHaveBeenCalledWith(
            {'x-ms-meta-foo': 'bar'},
            Object.keys(cryptoConfig.secrets.globalSecrets)
        );
        expect(decodeFn).toHaveBeenCalledWith(cryptoConfig);
        expect(decodeInvoke).toHaveBeenCalledWith(
            {foo: 'bar'},
            {userId: 'id1'},
            'ciphertext'
        );

        // URL and headers
        const expectedUrl = `https://acct.blob.core.windows.net/cont/id1.json?sas`;
        expect(axiosMock.get).toHaveBeenCalledWith(expectedUrl, {
            responseType: 'text',
            validateStatus: expect.any(Function),
            headers: {'x-ms-version': '2020-10-02'},
        });

        // final parsed object
        expect(result).toEqual({x: 42});
    });

    it('returns error on HTTP status ≥ 400', async () => {
        (axiosMock.get as jest.Mock).mockResolvedValue({
            status: 404,
            data: 'not found',
            headers: {},
        });

        const {get} = azureBlobStorage(
            {
                ...configBase,
                axios: axiosMock as AxiosStatic,
                _storageDecodeFn: decodeFn,
                _cryptoMetadataFromHeaders: metaFromFn,
            },
            cryptoConfig
        );

        await expect(errorsOrThrow(await get('id2'))).toEqual([
            'Failed to load blob: 404 "not found"',
        ]);
    });

    it('catches axios exceptions', async () => {
        const err = new Error('network err');
        (axiosMock.get as jest.Mock).mockRejectedValue(err);

        const {get} = azureBlobStorage(
            {
                ...configBase,
                axios: axiosMock as AxiosStatic,
                _storageDecodeFn: decodeFn,
                _cryptoMetadataFromHeaders: metaFromFn,
            },
            cryptoConfig
        );

expect(errorsOrThrow(await get('id3'))).toEqual([
            'Error loading data from Azure Blob Storage: network err',
        ]);
    });
});
