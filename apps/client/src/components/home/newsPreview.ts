import { shorten } from "@tc/utils/client";

export function getNewsPreview(content: string, maxLength = 140): string {
    const firstLine =
        content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .find((line) => line.length > 0) ?? "";

    const stripped = firstLine
        .replace(/^#{1,6}\s+/, "")
        .replace(/^\s*[-*+]\s+/, "")
        .replace(/^\s*\d+\.\s+/, "")
        .replace(/^\s*>\s+/, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/__(.+?)__/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/_(.+?)_/g, "$1")
        .replace(/`(.+?)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    return shorten(stripped, maxLength);
}
