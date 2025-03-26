// @ts-expect-error - Private JSON file
import pif2Votings from "../constants/tc-discussions.json";
import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import User from "../models/userModel";
import { styles } from "../helpers/consoleStyles";

class MigrationService {
    public async migratePif2Votings() {
        if (!process.env.MIGRATION || process.env.MIGRATION !== "true") return;
        console.log(`${styles("⚠  Migrating pif2 votings", ["orange", "bold", "underline"])}`);

        const votings = pif2Votings as IPif2Voting[];

        for (const voting of votings) {
            const author = await User.findByUsernameOrOsuId(voting.user.osu_id);
            const requiredVotes = voting.votes.length;
            const isActive = false;
            const category = "discussion";
            const assignedGroups = ["tc"];
            const title = voting.title;
            const description = voting.description;
            const duration = 3;
            const type = "classic";
            const options = voting.voting_options.map((option) => option.option);

            const deadline = new Date(voting.deadline);
            const createdAt = new Date(deadline.getTime() - duration * 24 * 60 * 60 * 1000);

            const newVoting = await new Voting({
                author,
                category,
                assignedGroups,
                title,
                description,
                duration,
                type,
                options,
                requiredVotes,
                createdAt,
                updatedAt: deadline,
                concludedAt: deadline,
                isActive,
            }).save();

            // Create a map of option IDs to their indices
            const optionIdToIndex = new Map(voting.voting_options.map((opt, index) => [opt.id, index]));

            // insert votes
            for (const vote of voting.votes) {
                const user = await User.findByUsernameOrOsuId(vote.user.osu_id);

                // Get the index of the selected option
                const optionIndex = optionIdToIndex.get(vote.voting_option_id);

                if (optionIndex === undefined) {
                    console.error(
                        `Could not find option index for vote option ID ${vote.voting_option_id} in voting ${voting.id}`
                    );
                    continue;
                }

                const newVote = await new Vote({
                    author: user,
                    comment: vote.comment,
                    data: {
                        type,
                        option: optionIndex,
                    },
                }).save();

                // Add vote to voting
                await Voting.findByIdAndUpdate(newVoting._id, {
                    $push: { votes: newVote._id },
                });

                console.log(`Migrated vote by ${user.username} for voting ${voting.title}`);
            }

            console.log(`Migrated voting ${voting.title}`);
        }

        console.log("Migration completed");
    }
}

interface IPif2Vote {
    comment?: string | null;
    user_id: number;
    discussion_id: number;
    voting_option_id: number;
    user: {
        id: number;
        username: string;
        osu_id: number;
    };
    voting_option: {
        id: number;
        discussion_id: number;
        option: string;
    };
}

interface IPif2VotingOption {
    id: number;
    discussion_id: number;
    option: string;
}

interface IPif2User {
    id: number;
    username: string;
    osu_id: number;
}

interface IPif2Voting {
    id: number;
    user_id: number;
    description: string;
    title: string;
    deadline: string;
    participant_threshold: number;
    user: IPif2User;
    voting_options: IPif2VotingOption[];
    votes: IPif2Vote[];
}

export default new MigrationService();
