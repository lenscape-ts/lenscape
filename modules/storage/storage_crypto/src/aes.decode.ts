export type AesDecodeFn = (
    secret: string,
    iv: string
) => (cipherB64: string) => Promise<string>;

export const aesDecodeFn: AesDecodeFn =
    (secret, iv) => async cipherB64 => {
        // 1) Decode Base64 secret → Uint8Array
        const keyBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBytes,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        // 2) Decode Base64 IV → Uint8Array
        const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

        // 3) Decode Base64 ciphertext+tag → Uint8Array
        const ctBytes = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));

        // 4) Decrypt
        const plainBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBytes },
            cryptoKey,
            ctBytes
        );

        // 5) Decode UTF-8 and return
        return new TextDecoder().decode(plainBuffer);
    };
