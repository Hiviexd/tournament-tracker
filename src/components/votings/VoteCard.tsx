import { Card, Group, Stack, Badge } from "@mantine/core";
import { IVote } from "../../../interfaces/Vote";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import { VOTE_COLORS } from "../../constants";

interface IProps {
    vote: IVote;
    options: string[];
}

export default function VoteCard({ vote, options }: IProps) {
    return (
        <Card
            bg="primary.10"
            shadow="xs"
            p="md"
            radius="md"
            style={{
                borderLeft: `4px solid ${VOTE_COLORS[vote.option % VOTE_COLORS.length]}`,
                background: `linear-gradient(90deg, ${
                    VOTE_COLORS[vote.option % VOTE_COLORS.length]
                } -20%, var(--mantine-color-primary-10) 3%) !important`,
            }}>
            <Stack gap="xs">
                <Group justify="space-between">
                    <UserDisplay user={vote.author} />
                    <Badge
                        size="lg"
                        variant="light"
                        color={VOTE_COLORS[vote.option % VOTE_COLORS.length]}>
                        {options[vote.option]}
                    </Badge>
                </Group>
                {vote.comment && <MarkdownText content={vote.comment} />}
            </Stack>
        </Card>
    );
}
