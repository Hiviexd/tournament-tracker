// Base
import { useState } from "react";
import { IVoting } from "../../../interfaces/Voting";
import { IVote } from "../../../interfaces/Vote";

// Mantine
import { Card, Stack, Title, Divider, Collapse, Group, Button, Text, List } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

// Components
import VoteCard from "./VoteCard";
import ClassicVoteStats from "./votes/ClassicVoteStats";
import BinaryVoteStats from "./votes/BinaryVoteStats";
import BinaryStrictVoteStats from "./votes/BinaryStrictVoteStats";
import VariableVoteStats from "./votes/VariableVoteStats";
import RankedChoiceVoteStats from "./votes/RankedChoiceVoteStats";
import { IUser } from "@interfaces/User";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserLink from "../common/UserLink";

interface IProps {
    voting: IVoting;
    user: IUser | null;
}

export default function VotingResults({ voting, user }: IProps) {
    const [filteredOptionIndex, setFilteredOptionIndex] = useState<number | null>(null);
    const [opened, { toggle }] = useDisclosure(!voting.isActive);

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
            if (vote.data.type === "binary-strict") {
                // For binary-strict with neutral: 0=agree, 1=neutral, 2=disagree
                // For binary-strict without neutral: 0=agree, 1=disagree
                if (voting.allowNeutralVotes) {
                    if (optionIndex === 0) return vote.data.score === 1; // agree
                    if (optionIndex === 1) return vote.data.score === 0; // neutral
                    if (optionIndex === 2) return vote.data.score === -1; // disagree
                } else {
                    if (optionIndex === 0) return vote.data.score === 1; // agree
                    if (optionIndex === 1) return vote.data.score === -1; // disagree
                }
            }
            if (vote.data.type === "variable" || vote.data.type === "ranked-choice") {
                const score = vote.data.scores.find((s) => s.optionIndex === optionIndex)?.score;
                return score !== undefined && score !== 0;
            }
            return false;
        });
    };

    const filteredVotes = filterVotesByOption(voting.votes, filteredOptionIndex);

    const renderVotingStats = () => {
        switch (voting.type) {
            case "classic":
                return (
                    <ClassicVoteStats
                        voting={voting}
                        onFilterChange={setFilteredOptionIndex}
                        activeFilter={filteredOptionIndex}
                    />
                );
            case "binary":
                return <BinaryVoteStats voting={voting} />;
            case "binary-strict":
                return (
                    <BinaryStrictVoteStats
                        voting={voting}
                        onFilterChange={setFilteredOptionIndex}
                        activeFilter={filteredOptionIndex}
                    />
                );
            case "variable":
                return <VariableVoteStats voting={voting} />;
            case "ranked-choice":
                return <RankedChoiceVoteStats voting={voting} />;
        }
    };

    return (
        <Card shadow="sm" p="lg" radius="md">
            <Stack gap="lg">
                <Title order={3}>Results</Title>
                {renderVotingStats()}
                {user?.isCommitteeOrAdmin && (
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
                            {voting.abstainedUsers?.length ? (
                                <Stack gap={5} mb="md">
                                    <Text size="sm" fw={500}>
                                        Abstained users:
                                    </Text>
                                    <List ml="md">
                                        {voting.abstainedUsers?.map((user) => (
                                            <List.Item key={user.id}>
                                                <UserLink user={user} size="sm" />
                                            </List.Item>
                                        ))}
                                    </List>
                                </Stack>
                            ) : null}
                            <Stack gap="md">
                                {filteredVotes.map((vote) => (
                                    <VoteCard key={vote.id} vote={vote} options={voting.options} allowNeutralVotes={voting.allowNeutralVotes} />
                                ))}
                            </Stack>
                        </Collapse>
                    </>
                )}
            </Stack>
        </Card>
    );
}
