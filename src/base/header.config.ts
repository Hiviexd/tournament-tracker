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
        links: [
            { title: "Team", link: "/team", icon: "users", permissions: [] },
            { title: "Changelog", link: "/changelog", icon: "clipboard-list", permissions: [] },
            { title: "News", link: "/news", icon: "newspaper", permissions: [] },
        ],
    },
    {
        title: "Tournaments",
        permissions: ["user"],
        link: "/tournaments",
    },
    {
        title: "Voting",
        permissions: ["committee"],
        link: "/voting",
    },
    {
        title: "Tickets & Reports",
        permissions: ["user"],
        links: [
            {
                title: "Submit Report",
                link: "/reports/create",
                icon: "paper-plane",
                permissions: ["user"],
            },
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
