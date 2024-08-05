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
        links: [
            { title: "Listing", to: "", icon: "trophy", permissions: ["user"] },
            {
                title: "Create",
                to: "/create",
                icon: "plus-circle",
                permissions: ["user"],
            },
        ],
    },
    {
        title: "Users",
        permissions: ["user"],
        href: "/users",
        links: [{ title: "Listing", to: "", icon: "user-friends", permissions: ["user"] }],
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
        title: "Voting",
        permissions: ["committee"],
        href: "/voting",
        links: [
            { title: "Listing", to: "", icon: "poll-h", permissions: ["committee"] },
            {
                title: "Create",
                to: "/create",
                icon: "vote-yea",
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
            {
                title: "Screening",
                to: "/screening",
                icon: "user-shield",
                permissions: ["admin"],
            },
            { title: "Logs", to: "/logs", icon: "clipboard", permissions: ["admin"] },
        ],
    },
];