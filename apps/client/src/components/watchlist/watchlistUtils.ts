import { InfringementType, IInfringement, TIME_BASED_TYPES } from "@tc/types/Infringement";
import { IUser } from "@tc/types/User";

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
        const sortedBans = bans.toSorted((a, b) => {
            const aActive = isTimeBasedType(a) && !isExpiredInfringement(a) ? 1 : 0;
            const bActive = isTimeBasedType(b) && !isExpiredInfringement(b) ? 1 : 0;
            if (bActive !== aActive) return bActive - aActive;
            return byCreatedDesc(a, b);
        });
        return sortedBans[0];
    }

    const warnings = infringements.filter((i) => i.type === InfringementType.WARNING);
    if (warnings.length > 0) {
        const latestWarning = warnings.reduce((latest, i) => (byCreatedDesc(latest, i) > 0 ? i : latest));
        return latestWarning;
    }

    const notes = infringements.filter((i) => i.type === InfringementType.NOTE);
    if (notes.length > 0) {
        const latestNote = notes.reduce((latest, i) => (byCreatedDesc(latest, i) > 0 ? i : latest));
        return latestNote;
    }
    return null;
}
