import { loadConfigFromDisk } from "./schema";

const config = loadConfigFromDisk();

export default config;
export type { AppConfig } from "./schema";
export { configSchema, loadConfigFromDisk } from "./schema";
