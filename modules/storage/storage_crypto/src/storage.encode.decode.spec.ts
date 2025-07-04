import {cryptoConfig, SecretConfig} from "./secrets";
import {defaultStorageDecodeFn, defaultStorageEncodeFn} from "./storage.encode.decode";

describe('storage encode/decode', () => {
    const globalSecret1 = '12345678123123123123321123'
    const globalSecret2 = 'ffffffffff3123123123321123'
    const secretConfig: SecretConfig = {
        globalSecrets: {'one': globalSecret1, 'two': globalSecret2},
        adminName: 'admin'
    }
    const config = cryptoConfig(secretConfig)
    it('should encode and decode data correctly', async () => {
        const {metadata, encoded} = await defaultStorageEncodeFn(config)('someUserId', 'someplaintext')
        const {globalFingerprint} = metadata
        expect(globalFingerprint).toEqual("one")
        const plaintextForUser = await defaultStorageDecodeFn(config)(metadata, {userId: 'someUserId'}, encoded)
        expect(plaintextForUser).toEqual('someplaintext')
        const plaintextForAdmin = await defaultStorageDecodeFn(config)(metadata, 'admin', encoded)
        expect(plaintextForAdmin).toEqual('someplaintext')
    })
})
