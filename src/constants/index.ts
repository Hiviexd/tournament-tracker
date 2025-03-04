export const VOTE_COLORS = [
    "var(--mantine-color-success-6)",
    "var(--mantine-color-danger-6)",
    "var(--mantine-color-warning-5)",
    "var(--mantine-color-info-6)",
    "var(--mantine-color-orange-7)",
    "var(--mantine-color-violet-6)",
    "var(--mantine-color-pink-6)",
    "var(--mantine-color-cyan-6)",
];

export const PREDEFINED_OPTIONS = [
    "I endorse and wish to see this user become a member of the team",
    "I have no issues or concerns with this user becoming a member of the team",
    "I have minor issues or concerns with this user becoming a member of the team",
    "I protest this user becoming a member of the team due to major concerns or issues",
    "Warning",
    "1-month ban",
    "3-month ban",
    "6-month ban",
    "1-year ban",
    "2-year ban",
    "Indefinite ban",
    "Debadge",
    "Approve badge + warning",
] as const;

export const TOURNAMENT_OPTIONS = [
    "No action required",
    "Warning",
    "1-month ban",
    "3-month ban",
    "6-month ban",
    "1-year ban",
    "2-year ban",
    "Indefinite ban",
] as const;

export const VOTE_PRESETS = {
    userAddition: {
        type: "binary" as const,
        options: ["Endorse Member", "Protest Member"],
        duration: 4,
    },
    tournamentBans: {
        type: "variable" as const,
        options: [...TOURNAMENT_OPTIONS],
        duration: 3,
    },
} as const;

export const DEFAULT_HUE = "36";
