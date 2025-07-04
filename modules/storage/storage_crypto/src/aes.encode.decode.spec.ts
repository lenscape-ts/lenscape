
// A constant 32‐byte key of all 0x01 bytes, Base64‐encoded
import {aesEncodeFn} from "./aes.encode";
import {aesDecodeFn} from "./aes.decode";

const SECRET_B64 = Buffer.from(new Uint8Array(32).fill(1)).toString('base64');
// A constant 12‐byte IV of all 0x02 bytes, Base64‐encoded
const IV_B64     = Buffer.from(new Uint8Array(12).fill(2)).toString('base64');

describe('AES-GCM encode/decode', () => {
    const encode = aesEncodeFn(SECRET_B64, IV_B64);
    const decode = aesDecodeFn(SECRET_B64, IV_B64);

    it('round-trips a simple string', async () => {
        const plaintext = 'Hello, world!';
        const cipherB64 = await encode(plaintext);
        expect(typeof cipherB64).toBe('string');

        const decrypted = await decode(cipherB64);
        expect(decrypted).toBe(plaintext);
    });

    it('round-trips an empty string', async () => {
        const plaintext = '';
        const cipherB64 = await encode(plaintext);
        const decrypted = await decode(cipherB64);
        expect(decrypted).toBe(plaintext);
    });

    it('produces non-empty ciphertext for non-empty input', async () => {
        const plaintext = 'Test data';
        const cipherB64 = await encode(plaintext);
        expect(cipherB64).not.toBe('');
        // decrypt back to be sure
        expect(await decode(cipherB64)).toBe(plaintext);
    });

    it('fails decryption with wrong IV', async () => {
        const cipherB64 = await encode('Secret');
        const wrongDecode = aesDecodeFn(SECRET_B64, Buffer.from(new Uint8Array(12).fill(3)).toString('base64'));
        await expect(wrongDecode(cipherB64)).rejects.toThrow();
    });

    it('fails decryption with wrong key', async () => {
        const cipherB64 = await encode('Another secret');
        const wrongKey = Buffer.from(new Uint8Array(32).fill(3)).toString('base64');
        const wrongDecode = aesDecodeFn(wrongKey, IV_B64);
        await expect(wrongDecode(cipherB64)).rejects.toThrow();
    });
});
