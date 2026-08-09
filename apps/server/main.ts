import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import utils from "@tc/utils/server";
import { AppModule } from "./app.module";
import { createExpressApp } from "./createExpressApp";

async function bootstrap() {
    const expressApp = createExpressApp();
    // bodyParser: false — createExpressApp already configures json/urlencoded (incl. Enchant rawBody)
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
        bodyParser: false,
    });

    // Important when using a prebuilt Express instance
    await app.init();

    const port = process.env.PORT || "3000";
    const environmentString = process.env.NODE_ENV || "⚠ Unknown";
    const environmentStyled = process.env.NODE_ENV
        ? utils.consoleStyles(process.env.NODE_ENV, ["yellow", "underline"])
        : utils.consoleStyles("⚠ Unknown", ["orange", "underline"]);

    const mode = process.env.MIGRATION === "true" ? "Run Migrations" : null;

    expressApp.set("port", port);

    await app.listen(port);

    console.log("┌──────────────────────────────────────────────────────────┐");
    console.log(`│ ${utils.consoleStyles("✓ Server started", ["green", "bold"])}${" ".repeat(41)}│`);
    console.log(
        `│   ${utils.consoleStyles("Port:", ["dim"])} ${utils.consoleStyles(port, ["cyan"])}${" ".repeat(
            49 - port.length,
        )}│`,
    );
    console.log(
        `│   ${utils.consoleStyles("Environment:", ["dim"])} ${environmentStyled}${" ".repeat(
            42 - environmentString.length,
        )}│`,
    );
    if (mode)
        console.log(
            `│   ${utils.consoleStyles("Mode:", ["dim"])} ${utils.consoleStyles(mode, ["orange", "bold"])}${" ".repeat(
                49 - mode.length,
            )}│`,
        );
    console.log("└──────────────────────────────────────────────────────────┘");
}

bootstrap();
