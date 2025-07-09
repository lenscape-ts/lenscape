# Storage Crypto

## Problem
- Container-level RBAC in blob storage can’t restrict access per user. 
- We need “crypto boxes” so only the creator or admin can decrypt each blob.

# Features
- A single 'current' global secret with key derivation allows for cryptographically strong keys for each id
- While only one global secret is 'active' for writing, multiple reads are allowed, which means we don't have an outage when we change global keys
- Each record can only be decrypted by the user or the admin
- All the metadata (apart from the secret) needed to decrypt the blob is stored in parallel to the blob 
- Very resiliant to crypto attacks: even if a single blob is 'hacked' and the key found, this key does not help find the global secret, and is not similar to other keys for the same user, so is of no help when decypting other 

## Components
- **Global secrets**  → derive per-ID wrap keys via HKDF + salt
- **Client ops**: DEK generation, wrapping, payload encryption, metadata headers
- **API**: holds master secrets, validates JWT, exposes wrap/unwrap endpoints
- **Storage**: blob body + user-metadata (`x-ms-meta-…`)

## Encryption Flow
1. Generate random DEK & payload IV.
2. Generate salt.
3. HKDF-derive user wrap-key (`info = userId`) and admin wrap-key (`info = "admin"`).
4. AES-GCM wrap DEK under each key (stores salt+IV+wrappedDEK in metadata).
5. AES-GCM encrypt payload with DEK (store in blob).

## Decryption Flow
1. Read blob metadata & body.
2. HKDF-derive wrap-key for user or admin.
3. AES-GCM decrypt wrapped DEK.
4. AES-GCM decrypt payload.

# Example code to encrypt:

```typescript
//setup
const globalSecret1 = '12345678123123123123321123' // probably injected via env variables.
const globalSecret2 = 'ffffffffff3123123123321123'

const cryptoConfig = cryptoConfig({
    globalSecrets: {'one': globalSecret1, 'two': globalSecret2}, //First one is used to write, any can be used to read
    adminName: 'admin'
})
const encryptor = defaultStorageEncodeFn(config1)
const decryptor = defaultStorageDecodeFn(config1)

//To encrypt
const {metadata, encoded} = await encryptor('someUserId', 'someplaintext')

//to decypt for a user or admin
const plainTextForUser = await decryptor(metadata, {userId: 'someUserId'}, encoded)
const plainTextForAdmin = await decryptor(metadata, 'admin', encoded)
```

