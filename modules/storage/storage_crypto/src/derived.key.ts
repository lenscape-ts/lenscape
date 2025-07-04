/**
 * Derives a 256-bit AES-GCM key via HKDF-SHA256 from:
 *  - globalSecret (Base64)
 *  - salt         (Base64)
 *  - info         (your id string)
 *
 * @param globalSecret Base64-encoded master secret
 * @param salt         Base64-encoded random salt (16+ bytes)
 * @param id           Context string (e.g. "user:alice" or "admin")
 * @returns            Base64 of the raw 32-byte AES key
 */

export type DerivedKeyFn = (
    globalSecret: string,
    salt: string,
    id: string,
) => Promise<string>;

export const defaultDerivedKey: DerivedKeyFn = async (
    globalSecret,
    salt,
    id,
): Promise<string> => {
    const encoder = new TextEncoder();

    // 1) Import the master secret for HKDF
    const masterSecretKey = await crypto.subtle.importKey(
        "raw",
        Uint8Array.from(atob(globalSecret), c => c.charCodeAt(0)),
        {name: "HKDF"},
        false,
        ["deriveKey"]
    );

    // 2) Derive a 256-bit AES-GCM key
    const wrapKey = await crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: Uint8Array.from(atob(salt), c => c.charCodeAt(0)),
            info: encoder.encode(id),
        },
        masterSecretKey,
        {name: "AES-GCM", length: 256},
        true,                           // extractable so we can export it
        ["encrypt", "decrypt", "wrapKey", "unwrapKey"]
    );

    // 3) Export the raw key material and Base64-encode it
    const rawKey = await crypto.subtle.exportKey("raw", wrapKey);
    const keyBytes = new Uint8Array(rawKey);
    return btoa(String.fromCharCode(...keyBytes));
};
