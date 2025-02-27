// Base
import { useState } from "react";
import { IVoting } from "../../../interfaces/Voting";

// Mantine
import { Card, Stack, Title, Divider } from "@mantine/core";

// Components
import VotingStats from "./VotingStats";
import VoteCard from "./VoteCard";
import { IUser } from "@interfaces/User";

interface IProps {
    voting: IVoting;
    user: IUser | null;
}

export default function VotingResults({ voting, user }: IProps) {
    const [filteredOptionIndex, setFilteredOptionIndex] = useState<number | null>(null);

    const filteredVotes =
        filteredOptionIndex !== null
            ? voting.votes.filter((vote) => {
                  if (vote.data.type === "classic") return vote.data.option === filteredOptionIndex;
                  if (vote.data.type === "binary") {
                      return filteredOptionIndex === 0 ? vote.data.score > 0 : vote.data.score < 0;
                  }
                  if (vote.data.type === "variable") {
                      const score = vote.data.scores.find((s) => s.optionIndex === filteredOptionIndex)?.score;
                      return score !== undefined && score !== 0;
                  }
                  return false;
              })
            : voting.votes;

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="lg">
                <Title order={3}>Results</Title>
                <VotingStats
                    voting={voting}
                    onFilterChange={setFilteredOptionIndex}
                    activeFilter={filteredOptionIndex}
                />
                {user?.isCommittee && (
                    <>
                        <Divider />
                        <Stack gap="md">
                            {filteredVotes.map((vote) => (
                                <VoteCard key={vote._id} vote={vote} options={voting.options} />
                            ))}
                        </Stack>
                    </>
                )}
            </Stack>
        </Card>
    );
}
