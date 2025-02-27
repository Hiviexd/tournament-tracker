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
    // {
    //     title: "Tournaments",
    //     permissions: ["user"],
    //     link: "/tournaments",
    // },
    {
        title: "Votes",
        permissions: ["user"],
        link: "/votes",
    },
    {
        title: "Reports",
        permissions: ["user"],
        link: "/reports/create",
        links: [
            {
                title: "Submit Report",
                link: "/reports/create",
                icon: "flag",
                permissions: ["user"],
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
        permissions: ["user"],
        link: "/tickets/create",
        links: [
            {
                title: "Submit Ticket",
                link: "/tickets/create",
                icon: "paper-plane",
                permissions: ["user"],
            },
            {
                title: "Tickets listing",
                link: "/tickets",
                icon: "mail-bulk",
                permissions: ["user"],
            },
        ],
    },

    {
        title: "Management",
        permissions: ["committee"],
        links: [
            { title: "Users", link: "/users", icon: "users", permissions: ["committee"] },
            { title: "Logs", link: "/logs", icon: "history", permissions: ["committee"] },
            { title: "Markdown", link: "/markdown", icon: "file-alt", permissions: ["committee"] },
        ],
    },
];
