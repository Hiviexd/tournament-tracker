// Base
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
    "var(--mantine-color-info-6)",
    "var(--mantine-color-success-6)",
    "var(--mantine-color-warning-5)",
    "var(--mantine-color-orange-7)",
    "var(--mantine-color-danger-6)",
    "var(--mantine-color-grape-6)",
];

export default function VotingResults({ voting }: IProps) {
    return (
        <Card shadow="sm" p="lg" bg="primary.11">
            <Stack gap="md">
                <Title order={3}>Votes</Title>
                <VotingStats voting={voting} voteColors={VOTE_COLORS} />
                <Divider />
                <Stack gap="xs">
                    {voting.votes.map((vote) => (
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
