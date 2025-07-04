import {NameAnd} from "@lenscape/records";
import {CryptoMetadata} from "./crypto.metadata";
import {defaultDerivedKey, DerivedKeyFn} from "./derived.key";
import {webcrypto} from "./web.crypto";
import {aesEncodeFn, AesEncodeFn} from "./aes.encode";
import {aesDecodeFn, AesDecodeFn} from "./aes.decode";

export type SecretConfig = {
    globalSecrets: NameAnd<string>;
    adminName: string;
};

export type RandomFn = (size: number) => Uint8Array
export const defaultRandomFn: RandomFn = (size: number) => {
    return webcrypto.getRandomValues(new Uint8Array(size));
}

export type Base64string = string
export type SaltCreator = () => Base64string
export const defaultSaltCreator = (random: RandomFn = defaultRandomFn): SaltCreator =>
    () => {
        const saltBytes = random(24);
        return btoa(String.fromCharCode(...saltBytes));
    }

export type IvCreator = () => Base64string;
export const defaultIvCreator = (random: RandomFn = defaultRandomFn): IvCreator => () => {
    const ivBytes = random(12);
    // btoa exists in browsers; in Node you can polyfill or use Buffer:
    return btoa(String.fromCharCode(...ivBytes));
};

export type AesKeyCreator = () => Base64string;
export const defaultAesKeyCreator = (random: RandomFn = defaultRandomFn): AesKeyCreator => () => {
    const keyBytes = random(32);
    return btoa(String.fromCharCode(...keyBytes));
};

export type CryptoConfig = {
    secrets: SecretConfig;
    aesDecoder: AesDecodeFn
    aesEncoder: AesEncodeFn
    aesKeyCreator: AesKeyCreator;
    saltCreator: SaltCreator
    ivCreator: IvCreator;
    derivedKey: DerivedKeyFn;
};

export function cryptoConfig(secrets: SecretConfig, random: RandomFn = defaultRandomFn): CryptoConfig {
    return {
        secrets,
        aesDecoder: aesDecodeFn,
        aesEncoder: aesEncodeFn,
        aesKeyCreator: defaultAesKeyCreator(random),
        ivCreator: defaultIvCreator(random),
        saltCreator: defaultSaltCreator(random),
        derivedKey: defaultDerivedKey,
    }
}

export type CryptoMetadataAndSecret = {
    metadata: CryptoMetadata;
    secret: Base64string;
}


export const makeCryptoMetadataAndSecret = (config: CryptoConfig) => {
    const {secrets, aesKeyCreator, saltCreator, ivCreator, derivedKey} = config;
    const entries = Object.entries(secrets.globalSecrets);
    if (entries.length === 0) throw new Error("Must have at least one global secret in globalSecrets");
    const [globalFingerprint, globalSecret] = entries[0];


    return async function cryptoMetadataFor(
        userId: string
    ): Promise<CryptoMetadataAndSecret> {
        const secret = aesKeyCreator();
        const payloadIv = ivCreator();
        const salt = saltCreator()

        const userIv = ivCreator();
        const userSecret = await derivedKey(globalSecret, salt, userId);
        const userWrapped = await config.aesEncoder(userSecret, userIv)(secret)

        const adminIv = ivCreator();
        const adminSecret = await derivedKey(globalSecret, salt, secrets.adminName);
        const adminWrapped = await config.aesEncoder(adminSecret, adminIv)(secret);

        const metadata: CryptoMetadata = {
            keyVersion: "1",
            algorithm: "AES-GCM",
            globalFingerprint,
            salt,
            iv: payloadIv,
            user: {iv: userIv, wrappedKey: userWrapped},
            admin: {iv: adminIv, wrappedKey: adminWrapped},
        };
        return {secret, metadata}
    };
};
