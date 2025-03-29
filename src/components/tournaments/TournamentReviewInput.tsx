import { Stack, Checkbox, Textarea, Radio, Group, Button, Text } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { useState } from "react";
import { REVIEW_CHECKLIST } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    tournament: ITournament;
}

type ChecklistState = Record<string, boolean>;

export default function TournamentReviewInput({ tournament }: IProps) {
    // Initialize state with all items set to false
    const [checkedState, setCheckedState] = useState<ChecklistState>(() => {
        const initialState: ChecklistState = {};
        for (const category of REVIEW_CHECKLIST) {
            for (const item of category.items) {
                initialState[item] = false;
            }
        }
        return initialState;
    });
    const [comment, setComment] = useState("");
    const [decision, setDecision] = useState<"approve" | "changesRequested" | "deny" | null>(null);

    // TODO: Implement review submission mutation
    const handleSubmitReview = () => {
        const reviewData = {
            tournamentId: tournament._id,
            checklist: Object.entries(checkedState).map(([item, isChecked]) => ({
                item,
                isChecked,
            })),
            comment,
            decision,
        };
        console.log("Submit review:", reviewData);
    };

    const handleCheckboxChange = (item: string, checked: boolean) => {
        setCheckedState((prev) => {
            const newState = { ...prev };
            newState[item] = checked;
            return newState;
        });
    };

    const isSubmitDisabled = !decision || !comment.trim() || Object.values(checkedState).every((v) => !v);

    const getButtonColor = () => {
        switch (decision) {
            case "approve":
                return "success";
            case "deny":
                return "danger";
            case "changesRequested":
                return "warning";
            default:
                return "blue";
        }
    };

    return (
        <Stack gap="md">
            {REVIEW_CHECKLIST.map((category) => (
                <Stack key={category.category} gap="xs">
                    <Text fw={500} size="sm" c="dimmed">
                        {category.category}
                    </Text>
                    {category.items.map((item) => (
                        <Checkbox
                            key={item}
                            label={item}
                            ml="md"
                            checked={checkedState[item] || false}
                            onChange={(event) => handleCheckboxChange(item, event.currentTarget.checked)}
                        />
                    ))}
                </Stack>
            ))}

            <Textarea
                label="Review Comments"
                description="Please provide detailed feedback about your decision"
                placeholder="Enter your review comments..."
                value={comment}
                onChange={(event) => setComment(event.currentTarget.value)}
                minRows={3}
                autosize
                required
            />

            <Radio.Group
                name="decision"
                label="Decision"
                value={decision || ""}
                onChange={(value) => setDecision(value as typeof decision)}
                required>
                <Group mt="xs">
                    <Radio value="approve" label="Approve" />
                    <Radio value="changesRequested" label="Changes Requested" />
                    <Radio value="deny" label="Deny" />
                </Group>
            </Radio.Group>

            <Button
                onClick={handleSubmitReview}
                disabled={isSubmitDisabled}
                variant="filled"
                color={getButtonColor()}
                leftSection={<FontAwesomeIcon icon="check" />}>
                Submit Review
            </Button>
        </Stack>
    );
}
