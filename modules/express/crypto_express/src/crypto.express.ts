import {RouterFn} from "@lenscape/express/src/router";
import {CryptoConfig, makeCryptoMetadataAndSecret, SecretConfig} from "@lenscape/storage_crypto/src/secrets";
import {jwtDecode} from "jwt-decode";

export const cryptoMetadataEndpoint = (cryptoConfig: CryptoConfig): RouterFn => async (router) => {
    router.post('/cryptotoencodefirsttime', async (_req, res) => {
        const jwt = _req.header('Authorization')?.replace('Bearer ', '');
        const decoded: any = jwtDecode(jwt)
        console.log(decoded)
        //don't forget to check if the jwt is valid when doing this for real
        const userId: string = decoded.oid
        const metadata = await makeCryptoMetadataAndSecret(cryptoConfig)(userId)
        res.json(metadata)
    })
}

