import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { apiReference } from "@scalar/express-api-reference";
import utils from "@tc/utils/server";
import type { Application } from "express";
import { AppModule } from "./app.module";
import { createExpressApp, registerFinalHandlers } from "./createExpressApp";
import { AllExceptionsFilter } from "./modules/common/filters/http-exception.filter";
import { createPublicOpenApiDocument } from "./openapi.build";

function registerApiDocs(expressApp: Application, openApiDocument: object): void {
    expressApp.get("/api/openapi.json", (_req, res) => {
        res.json(openApiDocument);
    });
    expressApp.use(
        "/api/docs",
        apiReference({
            url: "/api/openapi.json",
            theme: "default",
            persistAuth: true,
            metaData: {
                title: "Tournament Tracker API",
            },
        }),
    );
}

async function bootstrap() {
    const expressApp = createExpressApp();
    // bodyParser: false — createExpressApp already configures json/urlencoded (incl. Enchant rawBody)
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
        bodyParser: false,
    });

    app.setGlobalPrefix("api");
    app.useGlobalFilters(new AllExceptionsFilter());

    // Important when using a prebuilt Express instance
    await app.init();

    // Nest-generated public OpenAPI + Scalar (after init so createDocument sees all routes)
    const openApiDocument = createPublicOpenApiDocument(app);
    registerApiDocs(expressApp, openApiDocument);

    // After Nest routes + docs so 404/error handlers do not swallow them
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
