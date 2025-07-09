import express from 'express';
import {RouterFn} from "./router";

export const createApi = (...fns:RouterFn[] ) => {
    const app = express();
    const router = express.Router();

    fns.forEach(fn => fn(router))

    app.use(router);

    return app;
};
