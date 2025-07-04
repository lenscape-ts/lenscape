import {Base64string, CryptoConfig, makeCryptoMetadataAndSecret, SecretConfig} from "./secrets";
import {CryptoMetadata} from "./crypto.metadata";

export type EncodedAndMetadata = {
    encoded: Base64string
    metadata: CryptoMetadata
}
export type StorageEncodeFn = (config: CryptoConfig) => (id: string, text: string) => Promise<EncodedAndMetadata>

export type UserIdOrAdmin = 'admin' | { userId: string }
export type StorageDecodeFn = (config: CryptoConfig) => (meta: CryptoMetadata, userIdOrAdmin: UserIdOrAdmin, encoded: string) => Promise<string>


export const defaultStorageEncodeFn: StorageEncodeFn =
    config => async (userid, text) => {
        const {metadata, secret} = await makeCryptoMetadataAndSecret(config)(userid)
        const encoded = await config.aesEncoder(secret, metadata.iv)(text)
        return {encoded, metadata}
    }

export const defaultStorageDecodeFn: StorageDecodeFn = (config: CryptoConfig) => async (meta: CryptoMetadata, userIdOrAdmin: UserIdOrAdmin, encoded: string) => {
    const {secrets, aesDecoder, derivedKey} = config
    const {iv, user, admin, globalFingerprint, salt} = meta
    const {iv: keyIV, wrappedKey} = userIdOrAdmin === 'admin' ? admin : user
    const id = userIdOrAdmin === 'admin' ? config.secrets.adminName : userIdOrAdmin.userId
    const globalSecret = secrets.globalSecrets[globalFingerprint]
    if (!globalSecret) throw new Error(`Cannot find secret for ${globalFingerprint}. Legal fingerprints are ${Object.keys(secrets.globalSecrets)}`)
    const keyThatEncodesRealKey = await derivedKey(globalSecret, salt, id)
    const key = await aesDecoder(keyThatEncodesRealKey, keyIV)(wrappedKey)
    const result = await aesDecoder(key, iv)(encoded)
    return result

}