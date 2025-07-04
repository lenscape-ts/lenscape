import {NameAnd} from '@lenscape/records';
import {ErrorsOr, errorsOrThrow, Value, valueOrThrow} from '@lenscape/errors';
import {CryptoMetadata, WrappedKey} from './crypto.metadata';
import {cryptoMetadataFromHeaders, stringOr, wrappedKey} from "./crypto.metadata.from.headers";

describe('crypto.config helpers', () => {
    const base = 'x-ms-meta-';

    describe('stringOr', () => {
        it('returns the header value when present', () => {
            const headers: NameAnd<string> = {
                'x-ms-meta-foo': 'bar'
            };
            const errors: string[] = [];
            const v = stringOr(headers, 'foo', errors);
            expect(v).toBe('bar');
            expect(errors).toHaveLength(0);
        });

        it('pushes an error when missing', () => {
            const headers: NameAnd<string> = {};
            const errors: string[] = [];
            const v = stringOr(headers, 'baz', errors);
            expect(v).toBeUndefined();
            expect(errors).toEqual(["Header x-ms-meta-baz is required. Headers were "]);
        });
    });

    describe('wrappedKey', () => {
        it('parses both wrappedkey and iv when present', () => {
            const headers: NameAnd<string> = {
                'x-ms-meta-joe-wrappedkey': 'wk',
                'x-ms-meta-joe-iv': 'iv'
            };
            const errors: string[] = [];
            const res = wrappedKey(headers, 'joe', errors);
            expect(res).toEqual({wrappedKey: 'wk', iv: 'iv'});
            expect(errors).toHaveLength(0);
        });

        it('accumulates errors when missing parts', () => {
            const headers: NameAnd<string> = {
                'x-ms-meta-joe-wrappedkey': 'wk'
            };
            const errors: string[] = [];
            const res = wrappedKey(headers, 'joe', errors);
            expect(res.wrappedKey).toBe('wk');
            expect(res.iv).toBeUndefined();
            expect(errors).toEqual([
                "Header x-ms-meta-joe-iv is required. Headers were x-ms-meta-joe-wrappedkey"
            ]);
        });
    });

    describe('cryptoMetadataFromHeaders', () => {
        const LEGAL = ['goodprint'];
        const validHeaders: NameAnd<string> = {
            'x-ms-meta-keyversion': '1',
            'x-ms-meta-algorithm': 'AES-GCM',
            'x-ms-meta-iv': 'IVVAL',
            'x-ms-meta-salt': 'thesalt',
            'x-ms-meta-userid': 'user123',
            'x-ms-meta-user-wrappedkey': 'uwk',
            'x-ms-meta-user-iv': 'uiv',
            'x-ms-meta-admin-wrappedkey': 'awk',
            'x-ms-meta-admin-iv': 'aiv',
            'x-ms-meta-fingerprint': 'goodprint'
        };

        it('parses valid metadata successfully', () => {
            const m = valueOrThrow(cryptoMetadataFromHeaders(validHeaders, LEGAL))
            expect(m).toEqual({
                "admin": {
                    "iv": "aiv",
                    "wrappedKey": "awk"
                },
                "algorithm": "AES-GCM",
                "globalFingerprint": "goodprint",
                "salt": "thesalt",
                "iv": "IVVAL",
                "keyVersion": "1",
                "user": {
                    "iv": "uiv",
                    "wrappedKey": "uwk"
                }
            })
        });

        it('collects errors on missing core fields', () => {
            const h: NameAnd<string> = {junk: 'junk'};
            const out = errorsOrThrow(cryptoMetadataFromHeaders(h, LEGAL));
            expect(out).toEqual([
                "Header x-ms-meta-keyversion is required. Headers were junk",
                "Header x-ms-meta-algorithm is required. Headers were junk",
                "Header x-ms-meta-iv is required. Headers were junk",
                "Header x-ms-meta-salt is required. Headers were junk",
                "Header x-ms-meta-user-wrappedkey is required. Headers were junk",
                "Header x-ms-meta-user-iv is required. Headers were junk",
                "Header x-ms-meta-admin-wrappedkey is required. Headers were junk",
                "Header x-ms-meta-admin-iv is required. Headers were junk",
                "Header x-ms-meta-fingerprint is required. Headers were junk",
                "Crypto metadata version should be 1, was undefined",
                "Crypto algorithm should be AES-GCM, was undefined",
                "Fingerprint was undefined. This was illegal: should have been one of goodprint"
            ]);
        });

        it('errors on unsupported version or algorithm', () => {
            const h = {...validHeaders, 'x-ms-meta-keyversion': '2', 'x-ms-meta-algorithm': 'AES'};
            const out = errorsOrThrow(cryptoMetadataFromHeaders(h, LEGAL));
            expect(out).toEqual([
                "Crypto metadata version should be 1, was 2",
                "Crypto algorithm should be AES-GCM, was AES"
            ]);
        });

        it('errors on illegal fingerprint', () => {
            const h = {...validHeaders, 'x-ms-meta-fingerprint': 'badprint'};
            const out = errorsOrThrow(cryptoMetadataFromHeaders(h, LEGAL));
            expect(out).toEqual([
                    "Fingerprint was badprint. This was illegal: should have been one of goodprint"
                ]
            );
        });
    });
});
