
declare const globalThis: any;

let webcryptoImpl: Crypto | undefined;

// 1) Browser / modern runtimes:
if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    webcryptoImpl = globalThis.crypto as Crypto;
} else {
    // 2) Node.js fallback
    // Use require so TS doesn’t complain about missing exports
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('src/crypto.config') as any;
    if (nodeCrypto.webcrypto && nodeCrypto.webcrypto.subtle) {
        webcryptoImpl = nodeCrypto.webcrypto as Crypto;
    }
}

if (!webcryptoImpl) {
    throw new Error(
        'No WebCrypto implementation found: ' +
        'running in an unsupported environment'
    );
}

export const webcrypto = webcryptoImpl;
