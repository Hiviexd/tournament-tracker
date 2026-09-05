import { describe, expect, it } from "vitest";
import { InfringementType } from "@tc/types/Infringement";
import { TOURNAMENT_OPTIONS } from "@tc/types/Voting";
import {
    articleForPhrase,
    buildOsuAnnouncementChatUrl,
    buildSanctionAnnouncementMessages,
    buildSanctionPhrase,
    getSanctionAnnouncementChannel,
    getSanctionApplyState,
    isContestSanctionVote,
    isInfringementTicketLink,
    isOsuAnnouncementChatLink,
    parseSanctionDuration,
} from "@tc/utils";

describe("sanction announcement helpers", () => {
    it("uses a/an based on the phrase", () => {
        expect(articleForPhrase("warning")).toBe("a");
        expect(articleForPhrase("1 month tournament ban")).toBe("a");
        expect(articleForPhrase("indefinite hosting ban")).toBe("an");
    });

    it("builds duration and type phrases", () => {
        expect(buildSanctionPhrase("Warning", InfringementType.TOURNAMENT_BAN)).toBe("warning");
        expect(buildSanctionPhrase("1 month", InfringementType.TOURNAMENT_BAN)).toBe("1 month tournament ban");
        expect(buildSanctionPhrase("Indefinite", InfringementType.HOSTING_BAN)).toBe("indefinite hosting ban");
    });

    it("parses vote durations", () => {
        expect(parseSanctionDuration("Warning")).toBeNull();
        expect(parseSanctionDuration("1 month")).toEqual({ months: 1, indefinite: false });
        expect(parseSanctionDuration("2 years")).toEqual({ months: 24, indefinite: false });
        expect(parseSanctionDuration("Indefinite")).toEqual({ indefinite: true });
    });

    it("uses contest copy only for CC-only votes", () => {
        expect(isContestSanctionVote(["cc"])).toBe(true);
        expect(isContestSanctionVote(["tc"])).toBe(false);
        expect(isContestSanctionVote(["tc", "cc"])).toBe(false);
    });

    it("builds tournament ban messages with both appeal sentences", () => {
        const [intro, reason, outro] = buildSanctionAnnouncementMessages({
            isWarning: false,
            isContest: false,
            phrase: "1 month tournament ban",
            reason: "Broke the rules",
            sanctionType: InfringementType.TOURNAMENT_BAN,
        });

        expect(intro).toContain("tournament support expectations");
        expect(intro).toContain("https://osu.ppy.sh/wiki/en/Tournaments/Official_support");
        expect(intro).toContain("tournament restrictions");
        expect(intro).toContain("a **1 month tournament ban effective immediately.**");
        expect(intro).toContain("72 hours to appeal");
        expect(intro).toContain("streamer, commentator, or graphic designer");
        expect(intro).toContain("**Reason for sanction**:");
        expect(reason).toBe("Broke the rules");
        expect(outro).toContain("72 hours from now");
        expect(outro).toContain("tournament expectations");
        expect(outro).toContain("tournaments@ppy.sh");
        expect(outro).toContain("Tournament Sanction Appeal");
    });

    it("strips both appeal sentences for warnings", () => {
        const [intro, , outro] = buildSanctionAnnouncementMessages({
            isWarning: true,
            isContest: false,
            phrase: "warning",
            reason: "Be nicer",
            sanctionType: InfringementType.TOURNAMENT_BAN,
        });

        expect(intro).not.toContain("72 hours to appeal");
        expect(intro).not.toContain("streamer, commentator, or graphic designer");
        expect(intro).toContain("a **warning effective immediately.**");
        expect(outro).not.toContain("72 hours");
        expect(outro).not.toContain("tournaments@ppy.sh");
        expect(outro).toContain("tournament expectations");
    });

    it("swaps contest nouns and the appeal subject", () => {
        const [intro, , outro] = buildSanctionAnnouncementMessages({
            isWarning: false,
            isContest: true,
            phrase: "6 months tournament ban",
            reason: "Contest incident",
            sanctionType: InfringementType.TOURNAMENT_BAN,
        });

        expect(intro).toContain("contest support expectations");
        expect(intro).toContain("https://osu.ppy.sh/wiki/en/Contests/Official_support");
        expect(intro).toContain("contest and tournament restrictions");
        expect(intro).not.toContain("streamer, commentator, or graphic designer");
        expect(outro).toContain("contest expectations");
        expect(outro).toContain("tournaments@ppy.sh");
        expect(outro).toContain("Contest Sanction Appeal");
    });

    it("omits the tournament-ban role sentence for hosting bans", () => {
        const [intro] = buildSanctionAnnouncementMessages({
            isWarning: false,
            isContest: false,
            phrase: "1 month hosting ban",
            reason: "Hosted unsanctioned",
            sanctionType: InfringementType.HOSTING_BAN,
        });

        expect(intro).toContain("a **1 month hosting ban effective immediately.**");
        expect(intro).not.toContain("streamer, commentator, or graphic designer");
    });

    it("builds an osu! announcement chat URL", () => {
        expect(buildOsuAnnouncementChatUrl(44)).toBe("https://osu.ppy.sh/community/chat?channel_id=44");
        expect(isOsuAnnouncementChatLink("https://osu.ppy.sh/community/chat?channel_id=44")).toBe(true);
        expect(isInfringementTicketLink("https://osu.ppy.sh/community/chat?channel_id=44")).toBe(true);
        expect(isInfringementTicketLink("https://osu.enchant.com/spa/inbox/ticket/abc")).toBe(true);
        expect(isOsuAnnouncementChatLink("https://osu.enchant.com/spa/inbox/ticket/abc")).toBe(false);
    });

    it("sets the announcement title from the sanction outcome", () => {
        expect(
            getSanctionAnnouncementChannel({
                isWarning: true,
                isContest: false,
                sanctionType: InfringementType.TOURNAMENT_BAN,
            }).name,
        ).toBe("Notice of Tournament Warning");
        expect(
            getSanctionAnnouncementChannel({
                isWarning: true,
                isContest: true,
                sanctionType: InfringementType.TOURNAMENT_BAN,
            }).name,
        ).toBe("Notice of Contest Warning");
        expect(
            getSanctionAnnouncementChannel({
                isWarning: false,
                isContest: false,
                sanctionType: InfringementType.HOSTING_BAN,
            }).name,
        ).toBe("Notice of Hosting Ban");
        expect(
            getSanctionAnnouncementChannel({
                isWarning: false,
                isContest: false,
                sanctionType: InfringementType.STAFFING_BAN,
            }).name,
        ).toBe("Notice of Staffing Ban");
        expect(
            getSanctionAnnouncementChannel({
                isWarning: false,
                isContest: false,
                sanctionType: InfringementType.TOURNAMENT_BAN,
            }).name,
        ).toBe("Notice of Tournament Ban");
    });

    it("hides apply for no action and disables it on a Schulze tie", () => {
        const warningVote = {
            data: {
                type: "ranked-choice" as const,
                scores: TOURNAMENT_OPTIONS.map((_, index) => ({
                    optionIndex: index,
                    score: index === 1 ? 2 : -2,
                })),
            },
        };

        const warningState = getSanctionApplyState({
            isSanctionVote: true,
            isActive: false,
            assignedGroups: ["tc"],
            options: [...TOURNAMENT_OPTIONS],
            votes: [warningVote],
            sanctionType: InfringementType.TOURNAMENT_BAN,
            sanctionPost: "Reason",
        });
        expect(warningState.showButton).toBe(true);
        expect(warningState.disabled).toBe(false);
        expect(warningState.isWarning).toBe(true);
        expect(warningState.infringementType).toBe(InfringementType.WARNING);

        const noActionState = getSanctionApplyState({
            ...warningState,
            isSanctionVote: true,
            isActive: false,
            assignedGroups: ["tc"],
            options: [...TOURNAMENT_OPTIONS],
            votes: [
                {
                    data: {
                        type: "ranked-choice",
                        scores: TOURNAMENT_OPTIONS.map((_, index) => ({
                            optionIndex: index,
                            score: index === 0 ? 2 : -2,
                        })),
                    },
                },
            ],
            sanctionType: InfringementType.TOURNAMENT_BAN,
            sanctionPost: "Reason",
        });
        expect(noActionState.showButton).toBe(false);
        expect(noActionState.reason).toBe("no-action");

        const tieState = getSanctionApplyState({
            isSanctionVote: true,
            isActive: false,
            assignedGroups: ["tc"],
            options: [...TOURNAMENT_OPTIONS],
            votes: [],
            sanctionType: InfringementType.TOURNAMENT_BAN,
            sanctionPost: "Reason",
        });
        expect(tieState.showButton).toBe(true);
        expect(tieState.disabled).toBe(true);
        expect(tieState.reason).toBe("tie");

        const appliedState = getSanctionApplyState({
            isSanctionVote: true,
            isActive: false,
            sanctionAppliedAt: new Date(),
            assignedGroups: ["tc"],
            options: [...TOURNAMENT_OPTIONS],
        });
        expect(appliedState.showButton).toBe(true);
        expect(appliedState.disabled).toBe(true);
        expect(appliedState.reason).toBe("applied");
    });
});
