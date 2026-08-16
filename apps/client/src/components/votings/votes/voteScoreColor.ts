/** Map a -5..5 score to a Mantine color like `green.6` or `green-6`. */
export function getScoreColor(score: number, separator: "." | "-" = ".") {
    if (score === 0) return `gray${separator}6`;
    const level = Math.max(1, Math.round((Math.abs(score) / 5) * 8));
    return `${score > 0 ? "green" : "red"}${separator}${level}`;
}

export function getScoreCssVar(score: number) {
    return `var(--mantine-color-${getScoreColor(score, "-")})`;
}

export function formatSignedScore(score: number, digits?: number) {
    const value = digits === undefined ? String(score) : score.toFixed(digits);
    return score > 0 ? `+${value}` : value;
}
