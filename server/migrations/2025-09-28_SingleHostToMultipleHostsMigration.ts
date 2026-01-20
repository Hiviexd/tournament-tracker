import BaseMigration from "./BaseMigration";
import Tournament from "../models/tournamentModel";

export default class SingleHostToMultipleHostsMigration extends BaseMigration {
    name = "SingleHostToMultipleHosts";
    description = "Migrating tournaments from single host to multiple hosts";

    protected async execute(): Promise<void> {
        // Find all tournaments that still have the old 'host' field instead of 'hosts'
        const tournamentsToMigrate = await Tournament.find({
            host: { $exists: true },
            hosts: { $exists: false },
        });

        this.log(`Found ${tournamentsToMigrate.length} tournaments to migrate`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const tournament of tournamentsToMigrate) {
            try {
                // Convert single host to hosts array
                // @ts-expect-error - tournament.host was a thing pre-migration
                const hostId = tournament.host;
                if (hostId) {
                    // Set the hosts array with the single host
                    await Tournament.updateOne(
                        { _id: tournament._id },
                        {
                            $set: { hosts: [hostId] },
                            $unset: { host: 1 },
                        }
                    );
                    migratedCount++;
                    this.log(`✓ Migrated tournament: ${tournament.name}`);
                } else {
                    this.log(`⚠ Tournament ${tournament.name} has no host, skipping`);
                }
            } catch (error) {
                this.log(`✗ Failed to migrate tournament ${tournament.name}: ${error}`);
                errorCount++;
            }
        }

        this.log(`\n✓ Migration completed successfully!`);
        this.log(`  - Migrated: ${migratedCount} tournaments`);
        this.log(`  - Errors: ${errorCount} tournaments`);

        // Verification step
        const verificationCount = await Tournament.countDocuments({
            hosts: { $exists: true, $size: { $gte: 1 } },
        });
        const oldFormatCount = await Tournament.countDocuments({ host: { $exists: true } });

        this.log(`\n📊 Verification:`);
        this.log(`  - Tournaments with hosts array: ${verificationCount}`);
        this.log(`  - Tournaments with old host field: ${oldFormatCount}`);
    }
}
