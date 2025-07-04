import {cryptoMetadataToHeaders} from './crypto.metadata.to.headers';
import {CryptoMetadata} from './crypto.metadata';
import {NameAnd} from '@lenscape/records';
import {adminBase} from './crypto.metadata.from.headers';

describe('cryptoMetadataToHeaders', () => {
    const sampleMeta: CryptoMetadata = {
        keyVersion: '1',
        algorithm: 'AES-GCM',
        globalFingerprint: 'fprint123',
        iv: 'IV_BASE64',
        salt: 'thesalt',
        user: {iv: 'USER_IV', wrappedKey: 'USER_KEY'},
        admin: {iv: 'ADMIN_IV', wrappedKey: 'ADMIN_KEY'},
    };


    it('creates headers', () => {
        expect(cryptoMetadataToHeaders(sampleMeta)).toEqual({
            "x-ms-meta-admin-admin-iv": "ADMIN_IV",
            "x-ms-meta-admin-admin-wrappedkey": "ADMIN_KEY",
            "x-ms-meta-admin-algorithm": "AES-GCM",
            "x-ms-meta-admin-fingerprint": "fprint123",
            "x-ms-meta-admin-iv": "IV_BASE64",
            "x-ms-meta-admin-keyversion": "1",
            "x-ms-meta-admin-salt": "thesalt",
            "x-ms-meta-admin-user-iv": "USER_IV",
            "x-ms-meta-admin-user-wrappedkey": "USER_KEY"
        })
    });

    it('produces a new object each time (no mutation)', () => {
        const headers1 = cryptoMetadataToHeaders(sampleMeta);
        const headers2 = cryptoMetadataToHeaders(sampleMeta);
        // The two header maps are distinct objects
        expect(headers2).not.toBe(headers1);
        // But equal in content
        expect(headers2).toEqual(headers1);
    });
});
