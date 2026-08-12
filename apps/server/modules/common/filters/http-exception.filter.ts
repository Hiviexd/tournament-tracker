import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Nest exception filter preserving Express API error shape `{ error: string }`
 * and the Mongoose / CSRF mappings from registerFinalHandlers.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse<Response>();
        const req = ctx.getRequest<Request>();

        if (res.headersSent) {
            return;
        }

        const csrfCode =
            exception && typeof exception === "object" && "code" in exception
                ? (exception as { code?: string }).code
                : undefined;

        if (csrfCode === "EBADCSRFTOKEN") {
            res.status(403).json({ error: "Invalid CSRF token" });
            return;
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const body = exception.getResponse();

            // Preserve raw non-object bodies (e.g. users index returns `[]` with 400)
            if (typeof body !== "object" || body === null || Array.isArray(body)) {
                res.status(status).json(body);
                return;
            }

            const message = this.extractHttpMessage(exception);

            // Session-auth HTML clients redirect home; Enchant HMAC must stay 401
            const pathOnly = (req.originalUrl || req.url || "").split("?")[0];
            const isEnchant = pathOnly === "/api/enchant" || pathOnly.startsWith("/api/enchant/");
            if (
                status === HttpStatus.UNAUTHORIZED &&
                !isEnchant &&
                req.accepts(["html", "json"]) !== "json"
            ) {
                res.redirect("/");
                return;
            }

            res.status(status).json({ error: message });
            return;
        }

        const err = exception as { name?: string; message?: string };
        let customErrorMessage = "";
        let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        if (err?.name === "DocumentNotFoundError") {
            customErrorMessage = "Object not found";
            statusCode = HttpStatus.NOT_FOUND;
        } else if (err?.name === "ValidationError") {
            customErrorMessage = "Validation error";
            statusCode = HttpStatus.BAD_REQUEST;
        } else if (err?.name === "CastError") {
            customErrorMessage = "Invalid ID format";
            statusCode = HttpStatus.BAD_REQUEST;
        }

        const isDev = req.app.get("env") === "development";
        const responseMessage = customErrorMessage || (isDev ? err?.message : "Something went wrong!");

        res.status(statusCode).json({ error: responseMessage });

        if (!isDev) console.error(exception);
        else console.log(exception);
    }

    private extractHttpMessage(exception: HttpException): string {
        const body = exception.getResponse();
        if (typeof body === "string") {
            return body;
        }
        if (body && typeof body === "object") {
            const obj = body as Record<string, unknown>;
            if (typeof obj.message === "string") {
                return obj.message;
            }
            if (Array.isArray(obj.message)) {
                return obj.message.map(String).join(", ");
            }
            // Prefer a custom `error` payload when callers pass `{ error: "..." }`
            if (typeof obj.error === "string" && !("statusCode" in obj)) {
                return obj.error;
            }
        }
        return exception.message || "Something went wrong!";
    }
}
