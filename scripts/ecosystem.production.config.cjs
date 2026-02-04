/**
 * PM2 ecosystem config for production.
 * Usage (from project root, e.g. ~/projects/tournament-tracker):
 *   pm2 start scripts/ecosystem.production.config.cjs
 *   pm2 reload scripts/ecosystem.production.config.cjs
 *   pm2 stop scripts/ecosystem.production.config.cjs
 */
const path = require("path");

module.exports = {
    apps: [
        {
            name: "tcomm",
            script: "pnpm",
            args: "prod",
            cwd: path.join(__dirname, ".."),
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
        },
    ],
};
