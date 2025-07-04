
import {defaultDerivedKey} from './derived.key';
import {cryptoConfig, makeCryptoMetadataAndSecret,} from "./secrets";

const TEST_IV_B64 = 'AAAAAAAAAAAAAAAA'; // Base64 for 12 zero bytes
const SALT1_B64 = 'AAAAAAAAAAAAAAAAAAAAAA=='; // Base64 for 16 zero bytes
const SALT2_B64 = 'AQEBAQEBAQEBAQEBAQEBAQ=='; // Base64 for 16 bytes of value 0x01
const SALT3_B64 = '/////////////////////w=='; // Base64 for 16 bytes of 0xFF // Base64 for 12 zero bytes

describe('CryptoMetadata module',  () => {
    const constantRandom = (size: number): Uint8Array => Uint8Array.from({length: size}, () => 1);
    const secret = 'AQIDBAUGBwgJCgsMDQ4PEA=='; // Base64 of bytes [1..16]
    const globalSecrets = {fprint: secret};
    const adminName = 'admin';
    const config = cryptoConfig({globalSecrets, adminName}, constantRandom);
    const  maker =  makeCryptoMetadataAndSecret(config);

    it('cryptoConfig produces valid creators', () => {
        expect(typeof config.aesKeyCreator).toBe('function');
        expect(typeof config.ivCreator).toBe('function');
        expect(typeof config.derivedKey).toBe('function');
    });

    it('defaultIvCreator produces correct Base64 for constant random', () => {
        const iv = config.ivCreator();
        const buf = Buffer.from(iv, 'base64');
        expect(buf.length).toBe(12);
        expect(buf.every(b => b === 1)).toBe(true);
    });

    it('defaultAesKeyCreator produces 32-byte Base64 key', () => {
        const key = config.aesKeyCreator();

        const buf = Buffer.from(key, 'base64');
        expect(buf.length).toBe(32);
        expect(buf.every(b => b === 1)).toBe(true);
    });

    it('derivedKey is deterministic and different for different ids', async () => {

        const key1 = await defaultDerivedKey(secret, SALT1_B64, 'id1');
        const key1b = await defaultDerivedKey(secret, SALT1_B64, 'id1');
        const key2 = await defaultDerivedKey(secret, SALT2_B64, 'id2');
        expect(key1).toEqual('lKvr0xq8nkVJvMj5+yCRbPiB1cPELz5JO5RscuDjflY=')
        expect(key1b).toEqual(key1)
        expect(key2).toEqual('DgzW8A/W4BMfiZhsWjMehaFocEet2T2tBB8pdatlrY0=')
    });

    it('makeCryptoMetadata returns correct shape and values', async () => {
        const userId = 'user1';
        const {metadata} = await maker(userId);
        expect(metadata.keyVersion).toBe('1');
        expect(metadata.algorithm).toBe('AES-GCM');
        expect(metadata.globalFingerprint).toBe('fprint');

        // iv
        const ivBuf = Buffer.from(metadata.iv, 'base64');
        expect(ivBuf.length).toBe(12);
        // user envelope
        expect(metadata.user).toHaveProperty('iv');
        expect(metadata.user).toHaveProperty('wrappedKey');
        const uivBuf = Buffer.from(metadata.user.iv, 'base64');
        expect(uivBuf.length).toBe(12);
        const uwkBuf = Buffer.from(metadata.user.wrappedKey, 'base64');
        expect(uwkBuf.length).toBe(60);
        // admin envelope
        const aivBuf = Buffer.from(metadata.admin.iv, 'base64');
        expect(aivBuf.length).toBe(12);
        const awkBuf = Buffer.from(metadata.admin.wrappedKey, 'base64');
        expect(awkBuf.length).toBe(60);
        // ensure user/admin wraps differ
        expect(metadata.user.wrappedKey).not.toBe(metadata.admin.wrappedKey);
    });

    it('errors if no global secret provided', () => {
        expect(() => makeCryptoMetadataAndSecret(cryptoConfig({globalSecrets: {}, adminName}, constantRandom))).toThrow();
    });
});
