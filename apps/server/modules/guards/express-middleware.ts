import type { NextFunction, Request, Response } from "express";

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => unknown;

/**
 * Run an Express middleware inside a Nest CanActivate guard.
 * Resolves true when next() was called without a response; false if headers were sent.
 */
export function runExpressMiddleware(
    middleware: ExpressMiddleware,
    req: Request,
    res: Response,
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let done = false;
        const finish = (ok: boolean) => {
            if (!done) {
                done = true;
                resolve(ok);
            }
        };
        const next: NextFunction = (err?: unknown) => {
            if (err) {
                done = true;
                reject(err instanceof Error ? err : new Error(String(err)));
                return;
            }
            finish(!res.headersSent);
        };
        try {
            const result = middleware(req, res, next);
            void Promise.resolve(result)
                .then(() => {
                    if (res.headersSent) finish(false);
                })
                .catch(reject);
        } catch (e) {
            reject(e);
        }
    });
}
