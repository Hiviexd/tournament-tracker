/** DI domain helpers used by Nest *Service HTTP layers — not controllers. */
import { Injectable } from "@nestjs/common";
import { IVoting } from "@tc/types/Voting";
import { IVote } from "@tc/types/Vote";
import { IUser } from "@tc/types/User";
import { Document } from "mongoose";

@Injectable()
export class VotingDomainService {
    public censorVotingForNonCommittee(voting: Document & IVoting) {
        const publicVoting = voting.toObject();
        publicVoting.author = undefined as unknown as IUser;
        publicVoting.description = "";
        publicVoting.attachments = [];
        publicVoting.abstainedUsers = [];
        publicVoting.votes = publicVoting.votes.map((vote) => ({
            ...vote,
            comment: undefined,
            author: undefined,
        })) as unknown as IVote[];
        return publicVoting;
    }
}
