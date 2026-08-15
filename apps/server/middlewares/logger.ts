import morgan from "morgan";
import dayjs from "@tc/utils/dayjs";
import utils from "@tc/utils/server";
import type { StyleName } from "@tc/utils/backend";

morgan.token("time-colored", () => utils.consoleStyles(dayjs().format("HH:mm:ss.SSS"), ["dim"]));

function methodStyle(method: string): StyleName[] {
    switch (method) {
        case "GET":
            return ["green"];
        case "POST":
            return ["cyan"];
        case "PUT":
            return ["yellow"];
        case "PATCH":
            return ["orange"];
        case "DELETE":
            return ["red"];
        default:
            return ["dim"];
    }
}

morgan.token("method-colored", (req) => {
    const method = req.method ?? "";
    return utils.consoleStyles(method, methodStyle(method));
});

morgan.token("status-colored", (req, res) => {
    const status = res.statusCode;
    // Map status code ranges to styles
    const statusColorMap: { range: [number, number]; style: StyleName[] }[] = [
        { range: [500, 599], style: ["red"] },
        { range: [400, 499], style: ["orange"] },
        { range: [300, 399], style: ["cyan"] },
        { range: [200, 299], style: ["green"] },
        { range: [100, 199], style: ["dim"] },
    ];
    const match = statusColorMap.find(({ range }) => status >= range[0] && status <= range[1]);
    const style: StyleName[] = match ? match.style : ["dim"];
    return utils.consoleStyles(status.toString(), style);
});

morgan.token("method-colored", (req) => {
    const method = req.method ?? "";
    return utils.consoleStyles(method, methodStyle(method));
});

morgan.token("username-colored", (req: any, res: any) => {
    const username = req.session?.username || res.locals?.user?.username || "Unknown";
    return utils.consoleStyles(username, username === "Unknown" ? ["dim"] : ["cyan", "dim"]);
});

morgan.token("auth-method-colored", (req: any, res: any) => {
    const authMethod = res.locals?.authMethod || "Unknown";
    return utils.consoleStyles(authMethod, authMethod === "Unknown" ? ["dim"] : ["magenta", "dim"]);
});

morgan.token("ip-colored", (req: any) => {
    // Prefer req.ip (Express sets this correctly with trust proxy), fallback to req.connection.remoteAddress
    const ip = req.ip || req.connection?.remoteAddress || "Unknown IP";
    return utils.consoleStyles(ip, ip === "Unknown IP" ? ["dim"] : ["orange", "dim"]);
});

export const logger = morgan(
    `:time-colored — :method-colored ${utils.consoleStyles(":url", [
        "yellow",
        "bold",
    ])} :status-colored — :username-colored — :auth-method-colored — :ip-colored — ${utils.consoleStyles(
        ":response-time ms",
        ["magenta"],
    )}`,
);
