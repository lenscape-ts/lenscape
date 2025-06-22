import express from 'express';
import {createAppendStoreRoutes, requiredMiddlewareForAppendStoreApi} from "./src/async.storage.api";
import {AsyncFileStorageConfig, fileAppendStore, idToFileName22} from "@lenscape/async_file_storage/src/async.file.storage";
import {AsyncStoreConfig} from "@lenscape/async_storage";
import {nullCodec, stringCodec} from "@lenscape/codec";


const root = '/events'
const asyncStoreConfig: AsyncFileStorageConfig<string, string> = {
    idToFileName: idToFileName22(root, (id: string) => id),
    codec: stringCodec

}

const asyncStore = fileAppendStore(asyncStoreConfig)
const app = express();
requiredMiddlewareForAppendStoreApi(app);  // Explicitly document middleware requirement

const router = createAppendStoreRoutes(express.Router(), asyncStore, '/api');
app.use(router);
const PORT = 3000;
const server = app.listen(PORT);

server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${PORT} is already in use.`);
    } else {
        console.error('⚠️ Server failed to start:', error);
    }
    process.exit(1);  // Exit clearly with error
});

server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? address : `${address?.address}:${address?.port}`;
    console.log(`🚀 Server listening on ${bind}`);
});