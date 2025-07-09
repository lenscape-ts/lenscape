// src/routes/healthz.ts
import {Router, Request, Response} from 'express';
import {RouterFn} from "./router";

export const healthzEndpoint: RouterFn = (router: Router): void => {
    router.get('/healthz', (_req: Request, res: Response) => {
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: Date.now(),
        });
    });
};

