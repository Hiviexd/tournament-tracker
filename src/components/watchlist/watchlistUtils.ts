import { InfringementType, IInfringement, TIME_BASED_TYPES } from "../../../interfaces/Infringement";
import { IUser } from "../../../interfaces/User";

export const WATCHLIST_PAGE_SIZE = 20;

export function isTimeBasedType(i: IInfringement): boolean {
    return (i.isTimeBased ?? TIME_BASED_TYPES.includes(i.type as InfringementType)) === true;
}

export function isExpiredInfringement(i: IInfringement): boolean {
    return !!(i.endDate && new Date(i.endDate) < new Date());
}

/** Primary display priority: latest date-based ban (active over inactive), then latest warning, then latest note. */
export function getPrimaryInfringement(user: IUser): IInfringement | null {
    const infringements = user?.infringements ?? [];
    if (infringements.length === 0) return null;

    const byCreatedDesc = (a: IInfringement, b: IInfringement) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0);

    const bans = infringements.filter(isTimeBasedType);
    if (bans.length > 0) {
        const sortedBans = [...bans].sort((a, b) => {
            const aActive = isTimeBasedType(a) && !isExpiredInfringement(a) ? 1 : 0;
            const bActive = isTimeBasedType(b) && !isExpiredInfringement(b) ? 1 : 0;
            if (bActive !== aActive) return bActive - aActive;
            return byCreatedDesc(a, b);
        });
        return sortedBans[0];
    }

    const latestWarning = [...infringements]
        .filter((i) => i.type === InfringementType.WARNING)
        .sort(byCreatedDesc)[0];
    if (latestWarning) return latestWarning;

    const latestNote = [...infringements]
        .filter((i) => i.type === InfringementType.NOTE)
        .sort(byCreatedDesc)[0];
    return latestNote ?? null;
}
