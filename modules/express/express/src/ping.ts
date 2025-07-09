import {RouterFn} from "./router";
import {Router, Request, Response} from 'express';


export const pingEndpoint: RouterFn = (router: Router): void => {
    router.get('/ping', (_req: Request, res: Response) => {
        res.send('pong');
    });
};
