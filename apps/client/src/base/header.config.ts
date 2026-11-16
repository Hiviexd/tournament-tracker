import { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface IRoute {
    title: string;
    icon?: IconProp;
    permissions: string[];
    link?: string;
    links?: IRoute[];
}

/**
 * Whether `pathname` is `link` itself or a page nested under it (e.g. "/tickets/123" under "/tickets").
 * "/" only matches exactly, since it is a prefix of every path.
 */
export function isPathUnder(pathname: string, link?: string): boolean {
    if (!link) return false;
    if (link === "/") return pathname === "/";
    return pathname === link || pathname.startsWith(`${link}/`);
}

/** The most specific link (longest match) among `links` that `pathname` falls under. */
export function getActiveLink(links: IRoute[] | undefined, pathname: string): IRoute | undefined {
    return links
        ?.filter((link) => isPathUnder(pathname, link.link))
        .sort((a, b) => (b.link?.length ?? 0) - (a.link?.length ?? 0))[0];
}

/** Whether a top-level header route should be highlighted for `pathname`. */
export function isRouteActive(route: IRoute, pathname: string): boolean {
    return isPathUnder(pathname, route.link) || !!getActiveLink(route.links, pathname);
}

export const routes: IRoute[] = [
    {
        title: "Home",
        permissions: [],
        link: "/",
        // links: [
        //     { title: "Team", link: "/team", icon: "users", permissions: [] },
        //     { title: "Changelog", link: "/changelog", icon: "clipboard-list", permissions: [] },
        //     { title: "News", link: "/news", icon: "newspaper", permissions: [] },
        // ],
    },
    {
        title: "Tournaments",
        permissions: [],
        link: "/tournaments",
    },
    {
        title: "Votes",
        permissions: [],
        link: "/votes",
    },
    {
        title: "Reports",
        permissions: [],
        link: "/reports/create",
        links: [
            {
                title: "Create Report",
                link: "/reports/create",
                icon: "flag",
                permissions: [],
            },
            {
                title: "Reports Listing",
                link: "/reports",
                icon: "mail-bulk",
                permissions: ["user"],
            },
        ],
    },

    {
        title: "Tickets",
        permissions: [],
        link: "/tickets/create",
        links: [
            {
                title: "Create Ticket",
                link: "/tickets/create",
                icon: "paper-plane",
                permissions: [],
            },
            {
                title: "Tickets Listing",
                link: "/tickets",
                icon: "mail-bulk",
                permissions: [],
            },
        ],
    },

    {
        title: "Resources",
        permissions: [],
        links: [
            {
                title: "TC Documentation",
                link: "/docs",
                icon: "book",
                permissions: ["committee"],
            },
            {
                title: "Official Resources",
                link: "/resources/official",
                icon: "file-alt",
                permissions: [],
            },
            {
                title: "Community Resources",
                link: "/resources/community",
                icon: "users",
                permissions: [],
            },
            {
                title: "Assets Previewer",
                link: "/assets-previewer",
                icon: "images",
                permissions: [],
            },
            {
                title: "Mappool Compliance",
                link: "/mappool-compliance",
                icon: "check-circle",
                permissions: [],
            },
        ],
    },

    {
        title: "Management",
        permissions: ["committee"],
        links: [
            { title: "Users", link: "/users", icon: "users-gear", permissions: ["committee"] },
            { title: "Watchlist", link: "/watchlist", icon: "user-shield", permissions: ["committee"] },
            { title: "Logs", link: "/logs", icon: "history", permissions: ["committee"] },
            {
                title: "Templates",
                link: "/templates",
                icon: "comment-dots",
                permissions: ["committee"],
            },
            {
                title: "Quotes",
                link: "/quotes",
                icon: "quote-left",
                permissions: ["committee"],
            },
            {
                title: "News",
                link: "/news",
                icon: "newspaper",
                permissions: ["committee"],
            },
            {
                title: "Review Checklist",
                link: "/checklist",
                icon: "clipboard-list",
                permissions: ["committee"],
            },
            {
                title: "API Keys",
                link: "/keys",
                icon: "key",
                permissions: ["admin"],
            },
            {
                title: "Notification Jobs",
                link: "/notification-jobs",
                icon: "bell",
                permissions: ["admin"],
            },
            // {
            //     title: "Create Article",
            //     link: "/articles/create",
            //     icon: "file-circle-plus",
            //     permissions: ["admin"],
            // },
        ],
    },
];
