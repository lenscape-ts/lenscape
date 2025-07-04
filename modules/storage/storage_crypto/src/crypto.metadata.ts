import {NameAnd} from "@lenscape/records";
import {Base64string} from "./secrets";

export const metaHeaderBase = 'x-ms-meta-'
/**
 * Parameters needed to decrypt an encrypted blob.
 *
 * This metadata lives in the blob’s user‐metadata (`x-ms-meta-…`) and tells
 * the client how to unwrap the Data Encryption Key (DEK) and then decrypt
 * the blob payload itself.
 *
 * @property {1} keyVersion
 *   The version of wrap‐key parameters (salts, HKDF params, etc.) that
 *   were used to derive the AES‐GCM wrap keys. Always 1 for now; if you
 *   bump this in the future, clients should error unless they recognize the
 *   new version and have the right registry entry.
 *
 * @property {'AES-GCM'} algorithm
 *   The AES algorithm used for both wrapping the DEK and encrypting the blob.
 *
 * @property {string} globalFingerprint
 *  We have one global secret we can write with, and multiple we can read from. This is a string identifying which was used to writewas
 *
 * @property {string} iv
 *   Base64‐encoded 12-byte IV used when encrypting the blob payload with the DEK.
 *
 * @property {string} userid
 *  The user’s object ID, used to derive the user’s wrap‐key.
 *
 * @property {WrappedKey} user
 *   The DEK wrapped under the user’s derived wrap‐key.  Clients derive the
 *   wrap‐key by running HKDF(masterServerSecret, saltForVersion1, userObjectId).
 *   The wrappedKey field here is the Base64(AES-GCM(DEK)) and iv is its wrapping IV.
 *
 * @property {Record<string, WrappedKey>} admin
 *   One entry per admin key, keyed by your admin identifiers (e.g. "admin1").
 *   Each WrappedKey contains the DEK encrypted under that admin’s wrap‐key,
 *   plus the IV used for that wrap operation.
 */
export type CryptoMetadata = {
    keyVersion: '1';
    algorithm: 'AES-GCM';
    globalFingerprint: string
    salt: string
    iv: Base64string;
    user: WrappedKey;
    admin: WrappedKey;
};

/**
 * A single AES-GCM key‐wrap envelope.
 *
 * @property {string} iv
 *   Base64‐encoded 12-byte IV used in the AES-GCM wrap operation.
 *
 * @property {string} wrappedKey
 *   Base64-encoded ciphertext (raw DEK encrypted under the wrap‐key, with
 *   the 16-byte GCM auth tag appended).
 */
export type WrappedKey = {
    iv: Base64string;
    wrappedKey: Base64string;
};



