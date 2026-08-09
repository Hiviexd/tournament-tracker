import BaseMigration from "./BaseMigration";
import User from "../models/userModel";

export default class TestMigration extends BaseMigration {
    name = "Test";
    description = "Testing a migration by getting a user and checking if they exist";

    protected async execute(): Promise<void> {
        this.log(`Looking up user Hivie...`);

        const user = await User.findOne({ username: "Hivie" });

        if (user) {
            this.log(`✓ User exists`);
            this.log(`User: ${user.username}`);
            this.log(`User ID: ${user.osuId}`);
        } else {
            this.log(`✗ User does not exist`);
        }
    }
}
