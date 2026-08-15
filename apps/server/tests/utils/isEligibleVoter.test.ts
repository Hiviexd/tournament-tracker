import { describe, expect, it } from "vitest";
import { isEligibleVoter } from "@tc/utils";
import { createMockUser } from "./users";

describe("isEligibleVoter", () => {
    const activeTc = createMockUser({ groups: ["tc"], isActiveVoter: true });
    const inactiveTc = createMockUser({ groups: ["tc"], isActiveVoter: false });
    const activeCc = createMockUser({ groups: ["cc"], isActiveVoter: true });
    const activeBoth = createMockUser({ groups: ["tc", "cc"], isActiveVoter: true });

    it("returns true for an active voter in an assigned group", () => {
        expect(isEligibleVoter(activeTc, ["tc"])).toBe(true);
        expect(isEligibleVoter(activeCc, ["cc"])).toBe(true);
        expect(isEligibleVoter(activeBoth, ["tc"])).toBe(true);
        expect(isEligibleVoter(activeBoth, ["cc"])).toBe(true);
    });

    it("returns false when the user is not an active voter", () => {
        expect(isEligibleVoter(inactiveTc, ["tc"])).toBe(false);
    });

    it("returns false when the user is not in an assigned group", () => {
        expect(isEligibleVoter(activeTc, ["cc"])).toBe(false);
        expect(isEligibleVoter(activeCc, ["tc"])).toBe(false);
    });

    it("returns false for missing users or empty assigned groups", () => {
        expect(isEligibleVoter(null, ["tc"])).toBe(false);
        expect(isEligibleVoter(undefined, ["tc"])).toBe(false);
        expect(isEligibleVoter(activeTc, [])).toBe(false);
    });
});
