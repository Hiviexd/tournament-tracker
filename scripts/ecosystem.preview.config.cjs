/**
 * PM2 ecosystem config for preview.
 * Usage (from preview project root, e.g. ~/projects/tournament-tracker-preview):
 *   pm2 start scripts/ecosystem.preview.config.cjs
 *   pm2 reload scripts/ecosystem.preview.config.cjs
 *   pm2 stop scripts/ecosystem.preview.config.cjs
 */
const path = require("path");

module.exports = {
    apps: [
        {
            name: "tcomm-preview",
            script: "pnpm",
            args: "preview",
            cwd: path.join(__dirname, ".."),
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
        },
    ],
};
