import { describe, expect, it } from "vitest";
import { parseBatchUserInput, parseOsuProfileLink } from "@tc/utils";
import { validateOsuProfileLink } from "@tc/utils/backend";

describe("parseOsuProfileLink", () => {
    it.each([
        ["https://osu.ppy.sh/users/14102976", "14102976"],
        ["https://osu.ppy.sh/users/14102976/taiko", "14102976"],
        ["https://osu.ppy.sh/users/Hivie", "Hivie"],
        ["https://osu.ppy.sh/users/@Hivie", "Hivie"],
        ["https://osu.ppy.sh/u/14102976", "14102976"],
        ["https://osu.ppy.sh/u/Hivie", "Hivie"],
        ["14102976/taiko", "14102976"],
        ["username/osu", "username"],
        ["https://osu.ppy.sh/users/14102976/", "14102976"],
        ["https://osu.ppy.sh/users/14102976?mode=taiko", "14102976"],
        ["https://osu.ppy.sh/users/14102976#mania", "14102976"],
        ["https://osu.ppy.sh/users/@Hivie/osu", "Hivie"],
        ["osu.ppy.sh/u/14102976/fruits", "14102976"],
        ["HTTP://OSU.PPY.SH/USERS/Hivie", "Hivie"],
        ["  https://osu.ppy.sh/u/Hivie/  ", "Hivie"],
        ["player-name[1]/taiko", "player-name[1]"],
        ["14102976/", "14102976"],
    ])("reads %s as %s", (input, identifier) => {
        expect(parseOsuProfileLink(input)).toBe(identifier);
        expect(validateOsuProfileLink(input)).toBe(identifier);
    });

    it.each([
        "Hivie",
        "@Hivie",
        "",
        "   ",
        "https://osu.ppy.sh/beatmaps/1",
        "https://www.osu.ppy.sh/users/1",
        "https://example.com/users/1",
    ])("rejects %j", (input) => {
        expect(parseOsuProfileLink(input)).toBeNull();
        expect(validateOsuProfileLink(input)).toBeNull();
    });
});

describe("parseBatchUserInput", () => {
    it("splits ids and profile links on spaces, commas, and newlines", () => {
        expect(
            parseBatchUserInput("14102976/taiko, Hivie\nusername/osu @Albionthegreat https://osu.ppy.sh/beatmaps/1"),
        ).toEqual({
            identifiers: ["14102976", "Hivie", "username", "Albionthegreat"],
            invalid: ["https://osu.ppy.sh/beatmaps/1"],
        });
    });

    it("keeps usernames, strips a leading @, and collapses repeated separators", () => {
        expect(parseBatchUserInput("  @Hivie,,\n\tplayer-name[1]   player_1  ")).toEqual({
            identifiers: ["Hivie", "player-name[1]", "player_1"],
            invalid: [],
        });
    });

    it("leaves non-profile links and a lone @, and keeps duplicate names", () => {
        expect(parseBatchUserInput("@ Hivie Hivie https://osu.ppy.sh/wiki/en foo:bar /")).toEqual({
            identifiers: ["Hivie", "Hivie"],
            invalid: ["@", "https://osu.ppy.sh/wiki/en", "foo:bar", "/"],
        });
    });

    it("returns nothing for empty input", () => {
        expect(parseBatchUserInput("")).toEqual({ identifiers: [], invalid: [] });
        expect(parseBatchUserInput(" , \n\t ")).toEqual({ identifiers: [], invalid: [] });
    });
});
