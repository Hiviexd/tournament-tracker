import { describe, expect, it } from "vitest";
import { sanitizeFilename } from "@tc/utils/backend";

describe("sanitizeFilename", () => {
    it("keeps ASCII filenames unchanged", () => {
        expect(sanitizeFilename("report.png").ascii).toBe("report.png");
    });

    it("replaces non-ASCII characters with underscores", () => {
        expect(sanitizeFilename("hello тест world.png").ascii).toBe("hello_world.png");
    });

    it("uses a random name when the basename sanitizes to empty", () => {
        const { ascii } = sanitizeFilename("тест.png");
        expect(ascii).toMatch(/^[a-f0-9]{16}\.png$/);
    });

    it("uses a random name when there is no extension and nothing ASCII remains", () => {
        const { ascii } = sanitizeFilename("документ");
        expect(ascii).toMatch(/^[a-f0-9]{16}$/);
    });
});
