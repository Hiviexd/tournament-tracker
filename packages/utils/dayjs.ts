import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat.js";
import duration from "dayjs/plugin/duration.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import shortRelativeTime from "./plugins/dayjs-plugin-shortRelativeTime";

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(shortRelativeTime);

export default dayjs;
