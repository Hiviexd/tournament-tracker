// Base
import { useState } from "react";
import { IVoting } from "../../../interfaces/Voting";
import { IVote } from "../../../interfaces/Vote";

// Mantine
import { Card, Stack, Title, Divider, Collapse, Group, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

// Components
import VotingStats from "./VotingStats";
import VoteCard from "./VoteCard";
import { IUser } from "@interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    voting: IVoting;
    user: IUser | null;
}

export default function VotingResults({ voting, user }: IProps) {
    const [filteredOptionIndex, setFilteredOptionIndex] = useState<number | null>(null);
    const [opened, { toggle }] = useDisclosure(false);

    /**
     * Filters votes based on the selected option index
     */
    const filterVotesByOption = (votes: IVote[], optionIndex: number | null): IVote[] => {
        if (optionIndex === null) return votes;

        return votes.filter((vote) => {
            if (vote.data.type === "classic") return vote.data.option === optionIndex;
            if (vote.data.type === "binary") {
                return optionIndex === 0 ? vote.data.score > 0 : vote.data.score < 0;
            }
            if (vote.data.type === "variable") {
                const score = vote.data.scores.find((s) => s.optionIndex === optionIndex)?.score;
                return score !== undefined && score !== 0;
            }
            return false;
        });
    };

    const filteredVotes = filterVotesByOption(voting.votes, filteredOptionIndex);

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
                        <Group justify="space-between" align="center">
                            <Text fw={500}>Individual Votes ({filteredVotes.length})</Text>
                            <Button
                                variant="subtle"
                                onClick={toggle}
                                rightSection={<FontAwesomeIcon icon={opened ? "caret-up" : "caret-down"} />}>
                                {opened ? "Hide Votes" : "Show Votes"}
                            </Button>
                        </Group>
                        <Collapse in={opened}>
                            <Stack gap="md">
                                {filteredVotes.map((vote) => (
                                    <VoteCard key={vote._id} vote={vote} options={voting.options} />
                                ))}
                            </Stack>
                        </Collapse>
                    </>
                )}
            </Stack>
        </Card>
    );
}
