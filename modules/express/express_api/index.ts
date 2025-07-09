import {createApi, healthzEndpoint, pingEndpoint} from "@lenscape/express";
import {cryptoMetadataEndpoint} from "@lenscape/crypto_express";
import {CryptoConfig, cryptoConfig, SecretConfig} from "@lenscape/storage_crypto/src/secrets";

const secretConfig: SecretConfig = {
    globalSecrets: {
        'one': 'y4V5qT9kLJc2GQhN8RvZ6H1tZs9WP2Ob3FJ4uKp0aQ8='
    },
    adminName: 'admin'
}
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const config: CryptoConfig = cryptoConfig(secretConfig)
const api = createApi(healthzEndpoint, pingEndpoint, cryptoMetadataEndpoint(config))
console.log(`Starting Express API on port ${port}`)
api.listen(port)