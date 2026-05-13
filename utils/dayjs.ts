import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(advancedFormat);
dayjs.extend(duration);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);

export default dayjs;
