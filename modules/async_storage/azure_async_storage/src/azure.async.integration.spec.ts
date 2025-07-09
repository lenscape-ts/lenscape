import {azureBlobStorage, AzureBlobStorageConfig} from "./azure.async.storage";
import {toGitStoragePath} from "@lenscape/string_utils";
import axios from "axios";
import {cryptoConfig, SecretConfig} from "@lenscape/storage_crypto";
import {valueOrThrow} from "@lenscape/errors";

import {secrets} from '../secrets';

const azureConfig: AzureBlobStorageConfig = {
    version: '2020-08-04',
    accountName: secrets.AZURE_ACCOUNT_NAME,
    containerName: secrets.AZURE_CONTAINER_NAME,
    blobNameFn: id => toGitStoragePath(id),
    sasToken: secrets.AZURE_SAS_TOKEN,
    axios,
    blobtype: 'BlockBlob',
}
//

const globalSecret = '12345678123123123123321123'
const secretConfig: SecretConfig = {
    globalSecrets: {'one': globalSecret},
    adminName: 'admin'
}
const crypto = cryptoConfig(secretConfig)
const azureStorage = azureBlobStorage(azureConfig, crypto);

describe('azure async storage integration', () => {
    test('azure async storage', async () => {
        const id = 'test-blob';
        const content = 'Hello, Azure Blob Storage!';

        console.log('config', azureConfig);
        console.log('crypto', crypto);
        // Upload
        valueOrThrow(await azureStorage.store(id, content));


        // Download
        const downloadedContent = valueOrThrow(await azureStorage.get(id))
        expect(downloadedContent).toEqual(content);

    });
});
