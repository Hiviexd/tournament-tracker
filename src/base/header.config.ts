export interface IRoute {
    title: string;
    icon?: string;
    permissions: string[];
    link?: string;
    links?: IRoute[];
}

export const routes: IRoute[] = [
    {
        title: "Home",
        permissions: [],
        link: "/home",
        // links: [
        //     { title: "Team", link: "/team", icon: "users", permissions: [] },
        //     { title: "Changelog", link: "/changelog", icon: "clipboard-list", permissions: [] },
        //     { title: "News", link: "/news", icon: "newspaper", permissions: [] },
        // ],
    },
    {
        title: "Tournaments",
        permissions: ["user"],
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
                title: "Reports listing",
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
                title: "Tickets listing",
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
            { title: "Logs", link: "/logs", icon: "history", permissions: ["committee"] },
            {
                title: "Create Article",
                link: "/articles/create",
                icon: "file-circle-plus",
                permissions: ["admin"],
            },
        ],
    },
];
