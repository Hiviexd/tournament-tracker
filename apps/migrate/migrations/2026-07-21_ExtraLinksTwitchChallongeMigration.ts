import BaseMigration from "./BaseMigration";
import Tournament from "@tc/models/tournamentModel";
import utils from "@tc/utils/server";
import type { ExtraLinkType, ITournamentExtraLink } from "@tc/types/Tournament";

export default class ExtraLinksTwitchChallongeMigration extends BaseMigration {
    name = "ExtraLinksTwitchChallonge";
    description = "Reclassify tournament extra links with Twitch/Challonge URLs to their proper types";

    private classifyLink(link: ITournamentExtraLink): ITournamentExtraLink | null {
        let newType: ExtraLinkType | null = null;

        if (utils.isTwitchLink(link.url) && link.type !== "twitch") {
            newType = "twitch";
        } else if (utils.isChallongeLink(link.url) && link.type !== "challonge") {
            newType = "challonge";
        }

        if (!newType) return null;

        const name =
            link.name === utils.EXTRA_LINK_DEFAULTS[link.type] ? utils.EXTRA_LINK_DEFAULTS[newType] : link.name;

        return { type: newType, name, url: link.url };
    }

    protected async execute(): Promise<void> {
        const tournaments = await Tournament.find({
            "extraLinks.0": { $exists: true },
        }).lean();

        this.log(`Found ${tournaments.length} tournaments with extra links`);

        let migratedCount = 0;
        let linksUpdated = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const tournament of tournaments) {
            try {
                const extraLinks = (tournament.extraLinks ?? []) as ITournamentExtraLink[];
                let changed = false;

                const updatedLinks = extraLinks.map((link) => {
                    const classified = this.classifyLink(link);
                    if (!classified) return link;
                    changed = true;
                    linksUpdated++;
                    this.log(`  → ${tournament.name}: "${link.name}" (${link.type} → ${classified.type}) ${link.url}`);
                    return classified;
                });

                if (!changed) {
                    skippedCount++;
                    continue;
                }

                await Tournament.updateOne({ _id: tournament._id }, { $set: { extraLinks: updatedLinks } });
                migratedCount++;
                this.log(`✓ Updated tournament: ${tournament.name}`);
            } catch (error) {
                this.log(`✗ Failed to migrate tournament ${tournament.name}: ${error}`);
                errorCount++;
            }
        }

        this.log(`\n✓ Migration completed successfully!`);
        this.log(`  - Tournaments updated: ${migratedCount}`);
        this.log(`  - Links reclassified: ${linksUpdated}`);
        this.log(`  - Tournaments unchanged: ${skippedCount}`);
        this.log(`  - Errors: ${errorCount}`);
    }
}
