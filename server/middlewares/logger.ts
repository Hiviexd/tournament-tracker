import morgan from "morgan";
import moment from "moment";
import { styles, type StyleName } from "../helpers/consoleStyles";

morgan.token("time", () => moment().format("HH:mm:ss.SSS"));

morgan.token("status-colored", (req, res) => {
    const status = res.statusCode;
    const style: StyleName[] =
        status >= 500 ? ["red"] : status >= 400 ? ["yellow"] : status >= 300 ? ["cyan"] : ["green"];

    return styles(status.toString(), style);
});

morgan.token("method-colored", (req) => {
    const method = req.method as string;
    const style: StyleName[] =
        method === "GET"
            ? ["green"]
            : method === "POST"
                ? ["cyan"]
                : method === "PUT" || method === "PATCH"
                    ? ["yellow"]
                    : method === "DELETE"
                        ? ["red"]
                        : ["dim"];

    return styles(method, style);
});

export const logger = morgan(
    `${styles(":time", ["dim"])} -- :method-colored ${styles(":url", ["yellow", "bold"])} :status-colored ${styles(
        ":response-time ms",
        ["magenta"]
    )}`
);
