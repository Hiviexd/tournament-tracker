import morgan from "morgan";
import moment from "moment";
import utils from "../../utils";
import { StyleName } from "../../utils/backend";

morgan.token("time", () => moment().format("HH:mm:ss.SSS"));

morgan.token("status-colored", (req, res) => {
    const status = res.statusCode;
    const style: StyleName[] =
        status >= 500 ? ["red"] : status >= 400 ? ["yellow"] : status >= 300 ? ["cyan"] : ["green"];

    return utils.consoleStyles(status.toString(), style);
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

    return utils.consoleStyles(method, style);
});

export const logger = morgan(
    `${utils.consoleStyles(":time", ["dim"])} -- :method-colored ${utils.consoleStyles(":url", ["yellow", "bold"])} :status-colored ${utils.consoleStyles(
        ":response-time ms",
        ["magenta"]
    )}`
);
