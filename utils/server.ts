import * as common from "./common";
import * as backend from "./backend";

/** Server-only utils: same API as `utils/index` for `common` + `backend` keys, without pulling React/UI deps. */
export default {
    ...common,
    ...backend,
};
