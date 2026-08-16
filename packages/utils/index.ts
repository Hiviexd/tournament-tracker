/** Common-only utils entry — safe for any runtime. */
import * as common from "./common";
import * as sanction from "./sanction";

export default {
    ...common,
    ...sanction,
};

export * from "./common";
export * from "./sanction";
