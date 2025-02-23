// Base
import { useState } from "react";
import { IVoting } from "../../../interfaces/Voting";

// Mantine
import { Card, Stack, Title, Divider } from "@mantine/core";

// Components
import VotingStats from "./VotingStats";
import VoteCard from "./VoteCard";

interface IProps {
    voting: IVoting;
}

export default function VotingResults({ voting }: IProps) {
    const [activeFilter, setActiveFilter] = useState<number | null>(null);

    const filteredVotes =
        activeFilter !== null
            ? voting.votes.filter((vote) => vote.data.type === "classic" && vote.data.option === activeFilter)
            : voting.votes;

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Title order={3}>Votes</Title>
                <VotingStats voting={voting} onFilterChange={setActiveFilter} activeFilter={activeFilter} />
                <Divider />
                <Stack gap="xs">
                    {filteredVotes.map((vote) => (
                        <VoteCard key={vote._id} vote={vote} options={voting.options} />
                    ))}
                </Stack>
            </Stack>
        </Card>
    );
}
