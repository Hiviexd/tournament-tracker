import { Card, Group, Stack, Badge } from "@mantine/core";
import { IVote } from "../../../interfaces/Vote";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";

interface IProps {
    vote: IVote;
    options: string[];
    voteColors: string[];
}

export default function VoteCard({ vote, options, voteColors }: IProps) {
    return (
        <Card
            shadow="xs"
            p="md"
            radius="md"
            style={{
                borderLeft: `4px solid ${voteColors[vote.option % voteColors.length]}`,
                background: `linear-gradient(90deg, ${
                    voteColors[vote.option % voteColors.length]
                } -20%, var(--mantine-color-primary-10) 3%) !important`,
            }}>
            <Stack gap="xs">
                <Group justify="space-between">
                    <UserDisplay user={vote.author} />
                    <Badge
                        size="lg"
                        variant="light"
                        color={voteColors[vote.option % voteColors.length]}>
                        {options[vote.option]}
                    </Badge>
                </Group>
                {vote.comment && <MarkdownText content={vote.comment} />}
            </Stack>
        </Card>
    );
}
