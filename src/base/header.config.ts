export interface IRoute {
    title: string;
    permissions: string[];
    link: string;
    menuLinks?: IRoute[];
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
        title: "Tournament Reports",
        permissions: ["user"],
        link: "/reports",
        links: [
            {
                title: "Submit Report",
                link: "/reports",
                icon: "paper-plane",
                permissions: ["committee"],
            },
            {
                title: "Manage Reports",
                link: "/reports/manage",
                icon: "mail-bulk",
                permissions: ["committee"],
            },
        ],
    },

    {
        title: "Management",
        permissions: ["committee"],
        links: [
            { title: "Users", link: "/users", icon: "users", permissions: ["committee"] },
            { title: "Logs", link: "/logs", icon: "history", permissions: ["committee"] },
        ],
    },
];
