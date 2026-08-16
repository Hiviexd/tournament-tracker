import { spawn } from "node:child_process";

const jobName = process.argv.slice(2).find((arg) => arg !== "--" && !arg.startsWith("-"));
const env = { ...process.env, AUTOMATION_DEBUG: "true" };
if (jobName) env.AUTOMATION_JOB = jobName;

const child = spawn(
    "pnpm",
    ["run", "--parallel", "--filter", "@tc/server", "--filter", "@tc/client", "dev"],
    { env, stdio: "inherit", shell: true },
);

child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
});
