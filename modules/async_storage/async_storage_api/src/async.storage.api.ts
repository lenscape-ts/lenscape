import express, {Request, Response, Router} from 'express';

import {AppendAndGetAsyncStore} from "@lenscape/async_storage";
import {isErrors} from "@lenscape/errors";

// Helper function to explicitly document middleware requirement
export function requiredMiddlewareForAppendStoreApi(app: express.Application) {
    app.use(express.text({type: 'text/plain'}));
}

export function createAppendStoreRoutes(router: Router, asyncStore: AppendAndGetAsyncStore<string, string>, path: string): Router {

    router.get(`${path}/:theId`, async (req: Request, res: Response) => {
        const theId = req.params.theId;
        const result = await asyncStore.get(theId);

        if (isErrors(result)) {
            res.status(500).json(result); // send structured errors explicitly as JSON
        } else {
            res.type('text/plain').status(200).send(result.value.join('\n')); // explicitly plain text
        }
    });


    router.post(`${path}/:theId`, async (req: Request, res: Response) => {
        const theId = req.params.theId;

        if (typeof req.body !== 'string') {
            res.status(400).json({errors: ['Body must be plain text']});
            return
        }

        const appendResult = await asyncStore.append(theId, req.body);

        if (isErrors(appendResult)) {
            res.status(500).json(appendResult); // send errors explicitly
        } else {
            res.status(204).end();
        }
    });

    return router;
}
