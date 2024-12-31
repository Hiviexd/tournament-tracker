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

const VOTE_COLORS = [
    "var(--mantine-color-success-6)",
    "var(--mantine-color-danger-6)",
    "var(--mantine-color-info-6)",
    "var(--mantine-color-warning-5)",
    "var(--mantine-color-orange-7)",
    "var(--mantine-color-primary-6)",
];

export default function VotingResults({ voting }: IProps) {
    const [activeFilter, setActiveFilter] = useState<number | null>(null);

    const filteredVotes =
        activeFilter !== null
            ? voting.votes.filter((vote) => vote.option === activeFilter)
            : voting.votes;

    return (
        <Card shadow="sm" p="lg" bg="primary.11">
            <Stack gap="md">
                <Title order={3}>Votes</Title>
                <VotingStats
                    voting={voting}
                    voteColors={VOTE_COLORS}
                    onFilterChange={setActiveFilter}
                    activeFilter={activeFilter}
                />
                <Divider />
                <Stack gap="xs">
                    {filteredVotes.map((vote) => (
                        <VoteCard
                            key={vote._id}
                            vote={vote}
                            options={voting.options}
                            voteColors={VOTE_COLORS}
                        />
                    ))}
                </Stack>
            </Stack>
        </Card>
    );
}
