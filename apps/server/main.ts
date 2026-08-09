import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import utils from "@tc/utils/server";
import { AppModule } from "./app.module";
import { createExpressApp, registerFinalHandlers } from "./createExpressApp";

async function bootstrap() {
    const expressApp = createExpressApp();
    // bodyParser: false — createExpressApp already configures json/urlencoded (incl. Enchant rawBody)
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
        bodyParser: false,
    });

    app.setGlobalPrefix("api");

    // Important when using a prebuilt Express instance
    await app.init();

    // After Nest routes are registered so 404/error handlers do not swallow them
    registerFinalHandlers(expressApp);

    const port = process.env.PORT || "3000";
    const environmentString = process.env.NODE_ENV || "⚠ Unknown";
    const environmentStyled = process.env.NODE_ENV
        ? utils.consoleStyles(process.env.NODE_ENV, ["yellow", "underline"])
        : utils.consoleStyles("⚠ Unknown", ["orange", "underline"]);

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
    console.log("└──────────────────────────────────────────────────────────┘");
}

bootstrap();
