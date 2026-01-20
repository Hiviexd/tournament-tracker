# Creating Jobs

Create a new file: `<JobName>Job.ts`

```typescript
import BaseJob from "./BaseJob";

export default class MyNewJob extends BaseJob {
    name = "MyNewJob";
    schedule = "0 10 * * *"; // Cron schedule (e.g., daily at 10:00 UTC)

    protected async execute(): Promise<void> {
        // Your job logic here
        this.setSuccessMessage("Job executed!");
    }
}
```

The job will be automatically discovered and loaded on server start.

**Schedule format**: Cron syntax (e.g., `"0 12 * * *"` = daily at noon UTC)
