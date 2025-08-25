export const VOTE_COLORS = [
    "var(--mantine-color-success-6)",
    "var(--mantine-color-warning-5)",
    "var(--mantine-color-danger-6)",
    "var(--mantine-color-info-6)",
    "var(--mantine-color-orange-7)",
    "var(--mantine-color-violet-6)",
    "var(--mantine-color-pink-6)",
    "var(--mantine-color-cyan-6)",
];

export const PREDEFINED_OPTIONS = [
    "Debadge",
    "Approve badge + warning",
    "No action required",
    "Warning",
    "1-month ban",
    "3-month ban",
    "6-month ban",
    "1-year ban",
    "2-year ban",
    "Indefinite ban",
    "I endorse and wish to see this user become a member of the team",
    "I have no issues or concerns with this user becoming a member of the team",
    "I have minor issues or concerns with this user becoming a member of the team",
    "I protest this user becoming a member of the team due to major concerns or issues",
] as const;

export const USER_ADDITION_OPTIONS = ["Endorse Member", "Protest Member"] as const;

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

export const BADGE_SUPPORT_OPTIONS = [
    "Debadge tournament",
    "Approve badge + warning",
    "Approve badge + hosting probation",
    "Approve badge + staffing ban",
    "Approve badge",
] as const;

export const VOTE_PRESETS = {
    userAddition: {
        type: "binary-strict" as const,
        options: ["Approve", "Oppose"],
        duration: 4,
        allowNeutralVotes: false,
        forceFullParticipation: false,
    },
    tournamentBans: {
        type: "ranked-choice" as const,
        options: [...TOURNAMENT_OPTIONS],
        duration: 3,
        allowNeutralVotes: true,
        forceFullParticipation: false,
    },
    badgeSupport: {
        type: "ranked-choice" as const,
        options: [...BADGE_SUPPORT_OPTIONS],
        duration: 3,
        allowNeutralVotes: true,
        forceFullParticipation: false,
    },
    topThreeBadgeSupport: {
        type: "binary-strict" as const,
        options: ["Approve", "Oppose"],
        duration: 4,
        allowNeutralVotes: false,
        forceFullParticipation: true,
    },
} as const;

export const DEFAULT_HUE = "36";

// Colorblind accessibility modes
export type ColorblindMode = "none" | "deuteranopia" | "protanopia" | "tritanopia";

export const COLORBLIND_MODES = {
    none: "Normal Vision",
    deuteranopia: "Deuteranopia (Red-Green)",
    protanopia: "Protanopia (Red-blind)",
    tritanopia: "Tritanopia (Blue-Yellow)",
} as const;

export const DEFAULT_COLORBLIND_MODE: ColorblindMode = "none";

import checklist from "../../checklist.json";

export const TC_REVIEW_CHECKLIST = checklist.tc;
export const CC_REVIEW_CHECKLIST = checklist.cc;
