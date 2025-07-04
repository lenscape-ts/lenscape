import {NameAnd} from "@lenscape/records";
import {ErrorsOr} from "@lenscape/errors";
import {CryptoMetadata, metaHeaderBase, WrappedKey} from "./crypto.metadata";

export const adminBase = `x-ms-meta-admin-`;

export function stringOr(headers: NameAnd<string>, name: string, errors: string[]): string {
    const headerName = `${metaHeaderBase}${name}`;
    const value = headers[headerName];
    if (!value) errors.push(`Header ${headerName} is required. Headers were ${Object.keys(headers).sort()}`);
    return value
}

export function wrappedKey(headers: NameAnd<string>, name: string, errors: string[]): WrappedKey {
    const wrappedKeyHeaderName = `${metaHeaderBase}${name}-wrappedkey`;
    const wrappedKey = headers[wrappedKeyHeaderName];
    if (wrappedKey === undefined) errors.push(`Header ${wrappedKeyHeaderName} is required. Headers were ${Object.keys(headers).sort()}`);

    const ivHeaderName = `${metaHeaderBase}${name}-iv`;
    const iv = headers[ivHeaderName];
    if (iv === undefined) errors.push(`Header ${ivHeaderName} is required. Headers were ${Object.keys(headers).sort()}`);
    return {wrappedKey, iv}
}

export function cryptoMetadataFromHeaders(headers: NameAnd<string>, legalFingerprints: string[]): ErrorsOr<CryptoMetadata> {
    const errors: string[] = [];
    const admin: NameAnd<WrappedKey> = {}
    const value: CryptoMetadata = {
        keyVersion: stringOr(headers, 'keyversion', errors) as any,
        algorithm: stringOr(headers, 'algorithm', errors) as any,
        iv: stringOr(headers, 'iv', errors),
        salt: stringOr(headers, 'salt', errors),
        user: wrappedKey(headers, 'user', errors),
        admin: wrappedKey(headers, 'admin', errors),
        globalFingerprint: stringOr(headers, 'fingerprint', errors),
    }
    if (value.keyVersion !== '1')
        errors.push(`Crypto metadata version should be 1, was ${value.keyVersion}`)
    if (value.algorithm !== 'AES-GCM')
        errors.push(`Crypto algorithm should be AES-GCM, was ${value.algorithm}`)
    if (!legalFingerprints.includes(value.globalFingerprint))
        errors.push(`Fingerprint was ${value.globalFingerprint}. This was illegal: should have been one of ${legalFingerprints}`)
    return errors.length > 0 ? {errors} : {value};
}