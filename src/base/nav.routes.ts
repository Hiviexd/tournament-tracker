export default [
    {
        title: "Home",
        permissions: [],
        href: "/",
        links: [
            { title: "Team", to: "/team", icon: "users", permissions: [] },
            { title: "Changelog", to: "/changelog", icon: "clipboard-list", permissions: [] },
            { title: "News", to: "/news", icon: "newspaper", permissions: [] },
        ],
    },
    {
        title: "Tournaments",
        permissions: ["user"],
        href: "/tournaments",
    },
    {
        title: "Voting",
        permissions: ["committee"],
        href: "/voting",
    },
    {
        title: "Contact",
        permissions: ["user"],
        href: "/contact",
        links: [
            { title: "Submit Ticket", to: "", icon: "paper-plane", permissions: ["user"] },
            {
                title: "Manage Tickets",
                to: "/manage",
                icon: "mail-bulk",
                permissions: ["committee"],
            },
        ],
    },

    {
        title: "Admin",
        permissions: ["admin"],
        href: "/admin",
        links: [
            { title: "Panel", to: "", icon: "shield-alt", permissions: ["admin"] },
            { title: "Users", to: "/admin/users", icon: "users", permissions: ["admin"] },
            {
                title: "Screening",
                to: "/admin/screening",
                icon: "user-shield",
                permissions: ["admin"],
            },
            { title: "Logs", to: "/admin/logs", icon: "clipboard", permissions: ["admin"] },
        ],
    },
];
