/**
 * For parent pages, it will link to /{href}
 * For child pages, it will link to /{href}/{to}
 */

export default [
    {
        title: "Home",
        permissions: [],
        href: "",
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
            { title: "Users", to: "/users", icon: "users", permissions: ["admin"] },
            {
                title: "Screening",
                to: "/screening",
                icon: "user-shield",
                permissions: ["admin"],
            },
            { title: "Logs", to: "/logs", icon: "history", permissions: ["admin"] },
        ],
    },
];
