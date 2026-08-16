import { Badge, Card, Group, Stack, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RankedChoiceVoteScore } from "@tc/types/Vote";
import { TruncatedText } from "../../../common/TruncatedText";

interface IProps {
    scores: RankedChoiceVoteScore[];
    options: string[];
}

const RANKED_CHOICE_DISPLAY = {
    [-2]: { label: "Strongly Disagree", color: "red", icon: "thumbs-down", count: 2 },
    [-1]: { label: "Disagree", color: "warning", icon: "thumbs-down", count: 1 },
    0: { label: "Neutral", color: "gray", icon: "minus", count: 1 },
    1: { label: "Agree", color: "success", icon: "thumbs-up", count: 1 },
    2: { label: "Strongly Agree", color: "info", icon: "thumbs-up", count: 2 },
} as const;

const UNKNOWN_DISPLAY = { label: "Unknown", color: "gray", icon: "question", count: 1 } as const;

function getRankedChoiceDisplay(score: number) {
    switch (score) {
        case -2:
            return RANKED_CHOICE_DISPLAY[-2];
        case -1:
            return RANKED_CHOICE_DISPLAY[-1];
        case 0:
            return RANKED_CHOICE_DISPLAY[0];
        case 1:
            return RANKED_CHOICE_DISPLAY[1];
        case 2:
            return RANKED_CHOICE_DISPLAY[2];
        default:
            return UNKNOWN_DISPLAY;
    }
}

export default function RankedChoiceVoteDisplay({ scores, options }: IProps) {
    return (
        <Card bg="primary.11" p="xs" radius="sm" withBorder>
            <Stack gap={4}>
                {[...scores]
                    .sort((a, b) => a.optionIndex - b.optionIndex)
                    .map((entry) => {
                        const display = getRankedChoiceDisplay(entry.score);

                        return (
                            <Group key={entry.optionIndex} wrap="nowrap" justify="space-between">
                                <TruncatedText size="sm" w={{ base: 500, sm: 200 }}>
                                    {options[entry.optionIndex] ?? ""}
                                </TruncatedText>
                                <Tooltip label={display.label}>
                                    <Badge
                                        size="sm"
                                        variant="light"
                                        color={display.color}
                                        w={{ base: 100, xs: 40 }}
                                        style={{ textAlign: "center" }}>
                                        {Array.from({ length: display.count }).map((_, index) => (
                                            <FontAwesomeIcon
                                                key={index}
                                                icon={display.icon}
                                                style={{
                                                    marginRight: index < display.count - 1 ? "2px" : "0",
                                                }}
                                            />
                                        ))}
                                    </Badge>
                                </Tooltip>
                            </Group>
                        );
                    })}
            </Stack>
        </Card>
    );
}
