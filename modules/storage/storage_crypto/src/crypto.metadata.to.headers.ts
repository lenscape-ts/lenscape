import {CryptoMetadata} from "./crypto.metadata";
import {NameAnd} from "@lenscape/records";
import {adminBase} from "./crypto.metadata.from.headers";

/**
 * Build the x-ms-meta-* headers for a given CryptoMetadata object.
 *
 * @param meta  The CryptoMetadata describing how to decrypt the blob.
 * @returns     A map of header names → header values, ready to spread into your axios PUT.
 */
export type CryptoMetadataToHeadersFn = (meta: CryptoMetadata) => NameAnd<string>;
export const cryptoMetadataToHeaders:CryptoMetadataToHeadersFn = (meta: CryptoMetadata): NameAnd<string> => {
    const headers: NameAnd<string> = {};

    headers[`${adminBase}keyversion`] = meta.keyVersion.toString();
    headers[`${adminBase}algorithm`] = meta.algorithm;
    headers[`${adminBase}fingerprint`] = meta.globalFingerprint;
    headers[`${adminBase}iv`] = meta.iv;
    headers[`${adminBase}salt`] = meta.salt;

    headers[`${adminBase}user-iv`] = meta.user.iv;
    headers[`${adminBase}user-wrappedkey`] = meta.user.wrappedKey;
    headers[`${adminBase}admin-iv`] = meta.admin.iv
    headers[`${adminBase}admin-wrappedkey`] = meta.admin.wrappedKey;

    return headers;
};
