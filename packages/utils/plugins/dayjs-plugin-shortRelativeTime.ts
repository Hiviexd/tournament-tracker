import type { ConfigType, Dayjs, PluginFunc } from "dayjs";

/**
 * Adds {@link Dayjs#shortRelativeTime}: compact relative strings ("2d ago", "5h from now").
 */
const shortRelativeTimePlugin: PluginFunc = (_option, _dayjsClass, dayjs) => {
    dayjs.prototype.shortRelativeTime = function (this: Dayjs, now?: ConfigType): string {
        const target = this as Dayjs;
        const nowD = now !== undefined ? dayjs(now) : dayjs();

        if (!target.isValid()) {
            return "invalid date";
        }

        const diffMs = nowD.diff(target);
        const isPast = diffMs > 0;
        const absDiffMs = Math.abs(diffMs);

        const seconds = Math.floor(absDiffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        let timeUnit: string;
        if (years > 0) timeUnit = "years";
        else if (months > 0) timeUnit = "months";
        else if (days > 0) timeUnit = "days";
        else if (hours > 0) timeUnit = "hours";
        else if (minutes > 0) timeUnit = "minutes";
        else timeUnit = "seconds";

        let value: number;
        let unit: string;

        switch (timeUnit) {
            case "years":
                value = years;
                unit = "y";
                break;
            case "months":
                value = months;
                unit = "mo";
                break;
            case "days":
                value = days;
                unit = "d";
                break;
            case "hours":
                value = hours;
                unit = "h";
                break;
            case "minutes":
                value = minutes;
                unit = "m";
                break;
            case "seconds":
            default:
                value = Math.max(1, seconds);
                unit = "s";
                break;
        }

        const suffix = isPast ? " ago" : " from now";
        return `${value}${unit}${suffix}`;
    };
};

export default shortRelativeTimePlugin;

declare module "dayjs" {
    interface Dayjs {
        shortRelativeTime(now?: ConfigType): string;
    }
}
