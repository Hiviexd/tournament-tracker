/** Client (and isomorphic) entry — do not import from `server/`; use `./server` instead to avoid loading `frontend`. */
import * as common from "./common";
import * as frontend from "./frontend";
import * as backend from "./backend";

export default {
    ...common,
    ...frontend,
    ...backend,
};
