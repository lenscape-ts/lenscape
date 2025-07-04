export type AesEncodeFn = (secret: string, iv: string) => (data: string) => Promise<string>;

export const aesEncodeFn: AesEncodeFn =
    (secret, iv) => async data => {
        const encoder = new TextEncoder();

        // 1) Decode Base64 secret and import as AES-GCM key
        const keyBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBytes,
            {name: "AES-GCM"},
            false,
            ["encrypt"]
        );

        // 2) Decode Base64 IV
        const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

        // 3) Encode plaintext
        const plaintext = encoder.encode(data);

        // 4) Encrypt
        const ciphertextBuffer = await crypto.subtle.encrypt(
            {name: "AES-GCM", iv: ivBytes},
            cryptoKey,
            plaintext
        );

        // 5) Return Base64 of ciphertext (includes auth tag)
        const ctBytes = new Uint8Array(ciphertextBuffer);
        return btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
    };
