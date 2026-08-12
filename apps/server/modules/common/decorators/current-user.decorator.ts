import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { IUser } from "@tc/types/User";

/**
 * Returns the authenticated user attached by Nest auth guards (`request.user`),
 * falling back to `res.locals.user` for compatibility with the Express auth stack.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): IUser | undefined => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user ?? req.res?.locals?.user;
});
