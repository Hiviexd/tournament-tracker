# Creating Migrations

Create a new file: `YYYY-MM-DD_<MigrationName>Migration.ts`

```typescript
import BaseMigration from "./BaseMigration";

export default class MyNewMigration extends BaseMigration {
    name = "DoSomething";
    description = "Brief description of what this migration does";

    protected async execute(): Promise<void> {
        // Your migration logic here
        this.log("Migration step completed");
    }
}
```

**Run with**: `pnpm migrate DoSomething`

The date prefix is for file sorting only - you only need the name when running.
