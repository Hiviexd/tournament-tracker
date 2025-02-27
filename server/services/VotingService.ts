import { IVoting } from "../../interfaces/Voting";
import { IVote } from "../../interfaces/Vote";
import { IUser } from "@interfaces/User";

class VotingService {
    public censorVotingForNonCommittee(voting: IVoting) {
        const publicVoting = voting.toObject();
        publicVoting.author = undefined as unknown as IUser;
        publicVoting.description = "";
        publicVoting.attachments = [];
        publicVoting.votes = publicVoting.votes.map((vote) => ({
            ...vote,
            comment: undefined,
            author: undefined,
        })) as unknown as IVote[];
        return publicVoting;
    }
}

export default new VotingService();
