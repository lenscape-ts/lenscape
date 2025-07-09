import {cryptoConfig, SecretConfig} from "./secrets";
import {defaultStorageDecodeFn, defaultStorageEncodeFn} from "./storage.encode.decode";

describe('storage encode/decode', () => {
    const globalSecret1 = '12345678123123123123321123'
    const globalSecret2 = 'ffffffffff3123123123321123'
    const secretConfig1: SecretConfig = {
        globalSecrets: {'one': globalSecret1, 'two': globalSecret2},
        adminName: 'admin'
    }
    const secretConfig2: SecretConfig = {
        globalSecrets: {'two': globalSecret2},
        adminName: 'admin'
    }
    const config1 = cryptoConfig(secretConfig1)
    const config2 = cryptoConfig(secretConfig2)
    it('should encode and decode data correctly', async () => {
        const {metadata, encoded} = await defaultStorageEncodeFn(config1)('someUserId', 'someplaintext')
        const {globalFingerprint} = metadata
        expect(globalFingerprint).toEqual("one")
        const plaintextForUser = await defaultStorageDecodeFn(config1)(metadata, {userId: 'someUserId'}, encoded)
        expect(plaintextForUser).toEqual('someplaintext')
        const plaintextForAdmin = await defaultStorageDecodeFn(config1)(metadata, 'admin', encoded)
        expect(plaintextForAdmin).toEqual('someplaintext')
    })

    it('should decryt when default secret has cgabged', async () => {
        const {metadata, encoded} = await defaultStorageEncodeFn(config2)('someUserId', 'someplaintext')
        expect(metadata.globalFingerprint).toEqual('two')

        const plaintextForUser = await defaultStorageDecodeFn(config1)(metadata, {userId: 'someUserId'}, encoded)
        expect(plaintextForUser).toEqual('someplaintext')
        const plaintextForAdmin = await defaultStorageDecodeFn(config1)(metadata, 'admin', encoded)
        expect(plaintextForAdmin).toEqual('someplaintext')

    })

})
