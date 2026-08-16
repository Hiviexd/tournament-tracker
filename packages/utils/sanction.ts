import { InfringementType } from "@tc/types/Infringement";
import { RankedChoiceVote } from "@tc/types/Vote";
import { SanctionBanType, TOURNAMENT_OPTIONS, TournamentOption } from "@tc/types/Voting";
import { UserGroup } from "@tc/types/User";
import dayjs from "./dayjs";
import { getSchulzeResult } from "./common";

export const SANCTION_NO_ACTION_OPTION = "No action required" satisfies TournamentOption;
export const SANCTION_WARNING_OPTION = "Warning" satisfies TournamentOption;

const DURATION_MONTHS = {
    "1 month": 1,
    "3 months": 3,
    "6 months": 6,
    "1 year": 12,
    "2 years": 24,
} as const satisfies Record<string, number>;

const SANCTION_TYPE_LABELS = {
    [InfringementType.TOURNAMENT_BAN]: "tournament ban",
    [InfringementType.HOSTING_BAN]: "hosting ban",
    [InfringementType.STAFFING_BAN]: "staffing ban",
} as const satisfies Record<SanctionBanType, string>;

export interface SanctionDuration {
    months?: number;
    indefinite: boolean;
}

export interface SanctionInfringementDates {
    startDate?: Date;
    endDate?: Date;
}

export interface SanctionAnnouncementChannel {
    name: string;
    description: string;
}

export interface SanctionVoteResult {
    winnerOption: string | null;
    isFirstPlaceTie: boolean;
}

export function areSanctionVoteOptions(options: string[]): boolean {
    return (
        options.length === TOURNAMENT_OPTIONS.length &&
        TOURNAMENT_OPTIONS.every((option, index) => options[index] === option)
    );
}

export function isContestSanctionVote(assignedGroups: UserGroup[] | string[]): boolean {
    return assignedGroups.length === 1 && assignedGroups[0] === "cc";
}

export function parseSanctionDuration(option: string): SanctionDuration | null {
    if (option === SANCTION_NO_ACTION_OPTION || option === SANCTION_WARNING_OPTION) return null;
    if (option === "Indefinite") return { indefinite: true };
    const months = DURATION_MONTHS[option];
    if (!months) return null;
    return { months, indefinite: false };
}

export function getSanctionInfringementDates(winnerOption: string): SanctionInfringementDates {
    const duration = parseSanctionDuration(winnerOption);
    if (!duration) return {};

    const startDate = dayjs().startOf("day").toDate();
    if (duration.indefinite) return { startDate };

    return {
        startDate,
        endDate: dayjs(startDate).add(duration.months!, "months").add(1, "day").toDate(),
    };
}

export function buildSanctionPhrase(winnerOption: string, sanctionType: SanctionBanType): string {
    if (winnerOption === SANCTION_WARNING_OPTION) return "warning";
    const typeLabel = SANCTION_TYPE_LABELS[sanctionType];
    const durationLabel = winnerOption === "Indefinite" ? "indefinite" : winnerOption.toLowerCase();
    return `${durationLabel} ${typeLabel}`;
}

export function articleForPhrase(phrase: string): "a" | "an" {
    return /^[aeiou]/i.test(phrase) ? "an" : "a";
}

export function getSanctionAnnouncementChannel(params: {
    isWarning: boolean;
    isContest: boolean;
    sanctionType: SanctionBanType;
}): SanctionAnnouncementChannel {
    const { isWarning, isContest, sanctionType } = params;
    let name = "Notice of Tournament Ban";
    if (isWarning) {
        name = isContest ? "Notice of Contest Warning" : "Notice of Tournament Warning";
    } else if (sanctionType === InfringementType.HOSTING_BAN) {
        name = "Notice of Hosting Ban";
    } else if (sanctionType === InfringementType.STAFFING_BAN) {
        name = "Notice of Staffing Ban";
    }

    return {
        name,
        description: "Immediate Action Required",
    };
}

export function buildSanctionAnnouncementMessages(params: {
    isWarning: boolean;
    isContest: boolean;
    phrase: string;
    reason: string;
}): [string, string, string] {
    const { isWarning, isContest, phrase, reason } = params;
    const domain = isContest ? "contest" : "tournament";
    const wiki = isContest
        ? "https://osu.ppy.sh/wiki/en/Contests/Official_support"
        : "https://osu.ppy.sh/wiki/en/Tournaments/Official_support";
    const restrictions = isContest ? "contest and tournament restrictions" : "tournament restrictions";
    const appealSubject = isContest ? "Contest Sanction Appeal" : "Tournament Sanction Appeal";
    const article = articleForPhrase(phrase);
    const appealSentence = isWarning
        ? ""
        : " However, in the interest of fairness, you will be allowed 72 hours to appeal this decision.";

    const intro = `Hello,

You are receiving this email because we have found you to be in breach of osu!'s official ${domain} support expectations (linked [here](${wiki})), resulting in ${restrictions} being placed on your account. This message serves as an official notice that you are being issued ${article} **${phrase} effective immediately.**${appealSentence} Please note that you may still enlist as a streamer, commentator, or graphic designer while under a tournament ban.

**Reason for sanction**:`;

    const outroLines = [
        `We hope this serves as a stern warning that failure to uphold our ${domain} expectations will be appropriately punished, and that you take this as a learning experience for the future.`,
    ];
    if (!isWarning) {
        outroLines.unshift(
            `**You have until 72 hours from now to present a case in defense of these verified points. Should we not receive communication from you within this period, the ban will remain in place. Please be advised that once this window is over, the decision may not be appealed.**`,
            "",
        );
        outroLines.push(
            "",
            `To appeal this sanction, please send an e-mail to tournaments@ppy.sh with the subject "${appealSubject}".`,
        );
    }

    return [intro, reason, outroLines.join("\n")];
}

export interface SanctionVoteBallot {
    data?: { type: string; scores?: RankedChoiceVote["scores"] };
}

export interface SanctionApplyState {
    showButton: boolean;
    disabled: boolean;
    reason?: "not-sanction" | "active" | "applied" | "no-action" | "tie" | "invalid";
    winnerOption?: string;
    isWarning: boolean;
    isContest: boolean;
    isNoAction: boolean;
    isFirstPlaceTie: boolean;
    phrase?: string;
    messages?: [string, string, string];
    infringementType?: InfringementType;
}

function getRankedChoiceVotes(votes: SanctionVoteBallot[]): RankedChoiceVote[] {
    return votes
        .filter((vote): vote is { data: RankedChoiceVote } => vote.data?.type === "ranked-choice")
        .map((vote) => vote.data);
}

export function getSanctionVoteResult(
    options: string[],
    votes: SanctionVoteBallot[],
): SanctionVoteResult {
    const rankedChoiceVotes = getRankedChoiceVotes(votes);
    const { ranking, isFirstPlaceTie } = getSchulzeResult(rankedChoiceVotes, options.length);
    const winnerOption = ranking.length ? (options[ranking[0]] ?? null) : null;
    return { winnerOption, isFirstPlaceTie };
}

export function getSanctionApplyState(voting: {
    isSanctionVote?: boolean;
    isActive: boolean;
    sanctionAppliedAt?: Date | string | null;
    assignedGroups: UserGroup[] | string[];
    options: string[];
    votes?: SanctionVoteBallot[];
    sanctionType?: SanctionBanType;
    sanctionPost?: string;
}): SanctionApplyState {
    const isContest = isContestSanctionVote(voting.assignedGroups);
    const empty: SanctionApplyState = {
        showButton: false,
        disabled: true,
        isWarning: false,
        isContest,
        isNoAction: false,
        isFirstPlaceTie: false,
    };

    if (!voting.isSanctionVote) return { ...empty, reason: "not-sanction" };
    if (voting.isActive) return { ...empty, reason: "active" };
    if (voting.sanctionAppliedAt) return { ...empty, showButton: true, reason: "applied" };
    if (!voting.sanctionType || !voting.sanctionPost?.trim() || !areSanctionVoteOptions(voting.options)) {
        return { ...empty, reason: "invalid" };
    }

    const { winnerOption, isFirstPlaceTie } = getSanctionVoteResult(voting.options, voting.votes ?? []);
    if (!winnerOption) return { ...empty, reason: "invalid" };

    const isNoAction = winnerOption === SANCTION_NO_ACTION_OPTION;
    const isWarning = winnerOption === SANCTION_WARNING_OPTION;
    const phrase = buildSanctionPhrase(winnerOption, voting.sanctionType);
    const messages = buildSanctionAnnouncementMessages({
        isWarning,
        isContest,
        phrase,
        reason: voting.sanctionPost.trim(),
    });
    const infringementType = isWarning ? InfringementType.WARNING : voting.sanctionType;

    if (isFirstPlaceTie) {
        return {
            showButton: true,
            disabled: true,
            reason: "tie",
            winnerOption,
            isWarning,
            isContest,
            isNoAction,
            isFirstPlaceTie,
            phrase,
            messages,
            infringementType,
        };
    }

    if (isNoAction) {
        return {
            showButton: false,
            disabled: true,
            reason: "no-action",
            winnerOption,
            isWarning,
            isContest,
            isNoAction,
            isFirstPlaceTie,
            phrase,
            messages,
            infringementType,
        };
    }

    return {
        showButton: true,
        disabled: false,
        winnerOption,
        isWarning,
        isContest,
        isNoAction,
        isFirstPlaceTie,
        phrase,
        messages,
        infringementType,
    };
}
