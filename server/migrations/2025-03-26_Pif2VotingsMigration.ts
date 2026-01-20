import BaseMigration from "./BaseMigration";
import Voting from "../models/votingModel";
import Vote from "../models/voteModel";
import User from "../models/userModel";

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

export default class Pif2VotingsMigration extends BaseMigration {
    name = "Pif2Votings";
    description = "Migrating pif2 votings";

    protected async execute(): Promise<void> {
        const votings = [] as IPif2Voting[];

        // Used to have code that loads pif2 jsons in here, but it got lost along the way
        // 99% this won't ever be needed, but otherwise, get fucked lolol

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
                    this.log(
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

                this.log(`Migrated vote by ${user?.username} for voting ${voting.title}`);
            }

            this.log(`Migrated voting ${voting.title}`);
        }
    }
}
