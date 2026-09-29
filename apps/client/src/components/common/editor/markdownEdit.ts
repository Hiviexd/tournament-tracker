export interface RangeEdit {
    next: string;
    replaceStart: number;
    replaceEnd: number;
    selectionStart: number;
    selectionEnd: number;
}

function replaceRange(
    value: string,
    replaceStart: number,
    replaceEnd: number,
    text: string,
    selectionStart: number,
    selectionEnd: number,
): RangeEdit {
    return {
        next: value.slice(0, replaceStart) + text + value.slice(replaceEnd),
        replaceStart,
        replaceEnd,
        selectionStart,
        selectionEnd,
    };
}

/** Slice that replaces [replaceStart, replaceEnd) inside the original string. */
export function insertedText(edit: RangeEdit, originalLength: number): string {
    const end = edit.next.length - (originalLength - edit.replaceEnd);
    return edit.next.slice(edit.replaceStart, end);
}

export function wrap(value: string, start: number, end: number, before: string, after: string = before): RangeEdit {
    const selected = value.slice(start, end);
    const inserted = before + selected + after;
    const cursor = start + before.length;
    return replaceRange(value, start, end, inserted, cursor, selected ? cursor + selected.length : cursor);
}

function lineBounds(value: string, start: number, end: number) {
    const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lineEndIdx = value.indexOf("\n", end);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
    return { lineStart, lineEnd };
}

/** Adds `prefix` to each selected line, or removes it when every line already has it. */
export function prefixLines(value: string, start: number, end: number, prefix: string): RangeEdit {
    const { lineStart, lineEnd } = lineBounds(value, start, end);
    const lines = value.slice(lineStart, lineEnd).split("\n");
    const allPrefixed = lines.every((line) => line.startsWith(prefix));
    const nextBlock = lines.map((line) => (allPrefixed ? line.slice(prefix.length) : prefix + line)).join("\n");
    return replaceRange(value, lineStart, lineEnd, nextBlock, lineStart, lineStart + nextBlock.length);
}

export function indentLines(value: string, start: number, end: number): RangeEdit {
    const { lineStart, lineEnd } = lineBounds(value, start, end);
    const nextBlock = value
        .slice(lineStart, lineEnd)
        .split("\n")
        .map((line) => `  ${line}`)
        .join("\n");
    return replaceRange(value, lineStart, lineEnd, nextBlock, lineStart, lineStart + nextBlock.length);
}

export function outdentLines(value: string, start: number, end: number): RangeEdit {
    const { lineStart, lineEnd } = lineBounds(value, start, end);
    const nextBlock = value
        .slice(lineStart, lineEnd)
        .split("\n")
        .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
        .join("\n");
    return replaceRange(value, lineStart, lineEnd, nextBlock, lineStart, lineStart + nextBlock.length);
}

export function insert(value: string, start: number, end: number, text: string): RangeEdit {
    const cursor = start + text.length;
    return replaceRange(value, start, end, text, cursor, cursor);
}

const imageMarkdown = "![](LINK)";

export function insertImage(value: string, start: number, end: number): RangeEdit {
    const linkAt = imageMarkdown.indexOf("LINK");
    return replaceRange(value, start, end, imageMarkdown, start + linkAt, start + linkAt + "LINK".length);
}

export function insertPlaceholder(
    value: string,
    start: number,
    end: number,
    before: string,
    token: string,
    after: string,
    filledToken: string | null,
): RangeEdit {
    const selected = value.slice(start, end);
    const inserted = selected ? before + selected + after : before + token + after;
    let selectionStart: number;
    let selectionEnd: number;

    if (!selected) {
        selectionStart = start + before.length;
        selectionEnd = selectionStart + token.length;
    } else if (filledToken && after.includes(filledToken)) {
        selectionStart = start + before.length + selected.length + after.indexOf(filledToken);
        selectionEnd = selectionStart + filledToken.length;
    } else if (filledToken && before.includes(filledToken)) {
        selectionStart = start + before.indexOf(filledToken);
        selectionEnd = selectionStart + filledToken.length;
    } else {
        selectionStart = start + inserted.length;
        selectionEnd = selectionStart;
    }

    return replaceRange(value, start, end, inserted, selectionStart, selectionEnd);
}

export function isHttpUrl(text: string): boolean {
    try {
        const url = new URL(text);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export function selectionInLinkOrImage(value: string, start: number, end: number): boolean {
    const linkRe = /!?\[[^\]\n]*\]\([^)\n]*\)/g;
    let match: RegExpExecArray | null;
    while ((match = linkRe.exec(value))) {
        const from = match.index;
        const to = from + match[0].length;
        if (start < to && end > from) return true;
    }
    return false;
}

/** Header, separator, and `bodyRows` body rows. */
export function createTable(columns: number, bodyRows: number): string {
    const row = (cells: string[]) => `| ${cells.join(" | ")} |`;
    const header = row(Array.from({ length: columns }, (_, index) => `Column ${index + 1}`));
    const separator = row(Array.from({ length: columns }, () => "---"));
    const body = Array.from({ length: bodyRows }, () => row(Array.from({ length: columns }, () => " ")));
    return `\n${[header, separator, ...body].join("\n")}\n`;
}
