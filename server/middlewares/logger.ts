import morgan from "morgan";
import moment from "moment";

morgan.token("time", () => moment().format("HH:mm:ss.SSS"));

morgan.token("status-colored", (req, res) => {
    const status = res.statusCode;
    const color =
        status >= 500
            ? 31 // red
            : status >= 400
                ? 33 // yellow
                : status >= 300
                    ? 36 // cyan
                    : 32; // green

    return `\x1b[${color}m${status}\x1b[0m`;
});

morgan.token("method-colored", (req) => {
    const method = req.method;
    const color =
        method === "GET"
            ? 32 // green
            : method === "POST"
                ? 34 // blue
                : method === "PUT" || method === "PATCH"
                    ? 33 // yellow
                    : method === "DELETE"
                        ? 31 // red
                        : 90; // grey

    return `\x1b[${color}m${method}\x1b[0m`;
});

export const logger = morgan(
    ":time -- :method-colored\x1b[0m \x1b[33m:url\x1b[0m :status-colored \x1b[35m:response-time ms\x1b[0m"
);
