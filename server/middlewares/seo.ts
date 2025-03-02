import { Request, Response, NextFunction } from "express";
import { match } from "path-to-regexp";
import config from "../../config.json";
import { seoRoutes, defaultMetadata, modelMap, type SEOMetadata } from "../constants/seo.config";
import { Model } from "mongoose";

const CRAWLER_USER_AGENTS = ["discord"];

export async function handleCrawlers(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
    const isCrawler = CRAWLER_USER_AGENTS.some((crawler) => userAgent.includes(crawler));

    if (!isCrawler) return next();

    try {
        const metadata = await generateMetadata(req);
        const html = generateHTML(metadata);
        res.send(html);
    } catch (error) {
        next();
    }
}

function formatTitle(pageTitle: string, isHome = false, dynamicName?: string, fullTitleOverride?: string) {
    if (isHome) {
        return {
            title: "Tournament Tracker",
        };
    }

    if (fullTitleOverride) {
        return {
            title: fullTitleOverride,
            ogSiteName: "Tournament Tracker",
        };
    }

    if (dynamicName) {
        return {
            title: `${dynamicName} - ${pageTitle}`,
            ogSiteName: "Tournament Tracker",
        };
    }

    return {
        title: pageTitle,
        ogSiteName: "Tournament Tracker",
    };
}

async function generateMetadata(req: Request): Promise<SEOMetadata & { url: string }> {
    const path = req.path;
    const baseUrl = config.baseUrl;

    if (path === "/" || path === "/home") {
        return {
            ...defaultMetadata,
            ...formatTitle("", true),
            url: `${baseUrl}${path}`,
        };
    }

    // First try to find an exact static route match
    let route = seoRoutes.find((route) => !route.isDynamic && route.path === path);

    // If no static route found, try dynamic routes
    if (!route) {
        route = seoRoutes.find((route) => {
            const matchFn = match(route.path, { decode: decodeURIComponent });
            const matchResult = matchFn(path);
            return matchResult !== false;
        });
    }

    if (!route) {
        return {
            ...defaultMetadata,
            url: `${baseUrl}${path}`,
        };
    }

    // Handle dynamic routes
    if (route.isDynamic && route.model && route.modelId) {
        const matchFn = match(route.path, { decode: decodeURIComponent });
        const matchResult = matchFn(path);

        if (matchResult && typeof matchResult !== "boolean") {
            const id = matchResult.params[route.modelId];
            const Model = modelMap[route.model] as Model<any>;
            const data = await Model.findById(id).populate("author", "username").lean();
            if (data && route.getMetadata) {
                const customMetadata = route.getMetadata(data);

                if (!customMetadata) {
                    return {
                        ...defaultMetadata,
                        url: `${baseUrl}${path}`,
                    };
                }

                const titleFormat = formatTitle(route.name, false, data.name || data.title, customMetadata.title);

                return {
                    ...customMetadata,
                    ...titleFormat,
                    url: `${baseUrl}${path}`,
                };
            }
        }
    }

    // Static routes
    const titleFormat = formatTitle(route.name || "");
    return {
        description: route.description || defaultMetadata.description,
        image: defaultMetadata.image,
        ...titleFormat,
        url: `${baseUrl}${path}`,
    };
}

function generateHTML(metadata: SEOMetadata & { url: string }): string {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8">
                <title>${metadata.title}</title>
                
                <!-- opengraph -->
                <meta property="og:type" content="website">
                <meta property="og:url" content="${metadata.url}">
                <meta property="og:title" content="${metadata.title}">
                ${metadata.ogSiteName ? `<meta property="og:site_name" content="${metadata.ogSiteName}">` : ""}
                <meta property="og:description" content="${metadata.description}">
                ${metadata.image ? `<meta property="og:image" content="${metadata.image}">` : ""}
                
                <!-- Twitter -->
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:url" content="${metadata.url}">
                <meta name="twitter:title" content="${metadata.title}">
                ${metadata.ogSiteName ? `<meta name="twitter:site" content="${metadata.ogSiteName}">` : ""}
                <meta name="twitter:description" content="${metadata.description}">
                ${metadata.image ? `<meta name="twitter:image" content="${metadata.image}">` : ""}
                
                <!-- Theme -->
                <meta name="theme-color" content="#FFB969">
                
                <!-- Redirect -->
                <!-- <meta http-equiv="refresh" content="0;url=${metadata.url}"> -->
            </head>
            <body>
                <h1>${metadata.title}</h1>
                <p>${metadata.description}</p>
                ${metadata.image ? `<img src="${metadata.image}" alt="${metadata.title}">` : ""}
            </body>
        </html>`;
}
