import type { CSSProperties } from "react";

/** Apply CSS custom properties that React's CSSProperties type does not include. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
    // SAFETY: React.CSSProperties does not include CSS custom properties.
    return vars as CSSProperties;
}
