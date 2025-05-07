import { Stack, Checkbox, Radio, Group, Button, Text } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { useState } from "react";
import { TC_REVIEW_CHECKLIST, CC_REVIEW_CHECKLIST } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSubmitReview } from "../../hooks/useTournaments";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import TextEditor from "../common/TextEditor";
import ReviewStatusBanner from "../common/banners/ReviewStatusBanner";

interface IProps {
    tournament: ITournament;
}

type ChecklistState = Record<string, boolean>;

export default function TournamentReviewInput({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const userReview = tournament.reviews?.find((review) => review.author?._id === user?._id);
    const autoSaveKey = `tournament-review-${tournament._id}`;
    const REVIEW_CHECKLIST = tournament.isTournament ? TC_REVIEW_CHECKLIST : CC_REVIEW_CHECKLIST;

    // Initialize state with existing review data or defaults
    const [checkedState, setCheckedState] = useState<ChecklistState>(() => {
        const initialState: ChecklistState = {};

        // First set all items to false
        for (const category of REVIEW_CHECKLIST) {
            for (const item of category.items) {
                initialState[item] = false;
            }
        }

        // Then populate with user's existing review data if available
        if (userReview?.checklist) {
            for (const item of userReview.checklist) {
                initialState[item.item] = item.checked;
            }
        }

        return initialState;
    });

    const [comment, setComment] = useState(userReview?.comment ?? "");
    const [decision, setDecision] = useState<"approve" | "changesRequested" | "deny" | null>(userReview?.vote ?? null);

    const submitReviewMutation = useSubmitReview(tournament._id);

    const handleSubmitReview = async () => {
        const reviewData = {
            tournamentId: tournament._id,
            checklist: Object.entries(checkedState).map(([item, checked]) => ({
                item,
                checked,
            })),
            comment,
            vote: decision!,
        };

        await submitReviewMutation.mutateAsync(reviewData);
    };

    const handleCheckboxChange = (item: string, checked: boolean) => {
        setCheckedState((prev) => ({
            ...prev,
            [item]: checked,
        }));
    };

    const isSubmitDisabled = !decision || Object.values(checkedState).every((v) => !v);

    return (
        <Stack gap="md">
            <ReviewStatusBanner tournament={tournament} user={user} />
            <Text component="label" fw={500} size="sm">
                Review Checklist
            </Text>
            <Text size="xs" c="dimmed">
                If something is inapplicable (i.e. not a LAN, no qualifiers, etc.), please mark it as cleared!
            </Text>
            {REVIEW_CHECKLIST.map((category) => (
                <Stack key={category.category} gap="xs">
                    <Text fw={400} size="sm" c="dimmed">
                        {category.category}
                    </Text>
                    {category.items.map((item) => (
                        <Checkbox
                            key={item}
                            label={item}
                            ml="md"
                            checked={checkedState[item]}
                            onChange={(event) => handleCheckboxChange(item, event.currentTarget.checked)}
                        />
                    ))}
                </Stack>
            ))}

            <Stack gap="xs" mt="md">
                <Text component="label" fw={500} size="sm">
                    Review Comments
                </Text>
                <TextEditor
                    value={comment}
                    onChange={setComment}
                    placeholder="Enter your review comments..."
                    minHeight={120}
                    maxHeight={300}
                    autoSaveKey={autoSaveKey}
                />
            </Stack>

            <Radio.Group
                name="decision"
                label="Decision"
                my="md"
                value={decision || ""}
                onChange={(value) => setDecision(value as typeof decision)}
                required>
                <Group mt="xs">
                    <Radio value="approve" label="Approve" />
                    <Radio value="changesRequested" label="Request Changes" />
                    <Radio value="deny" label="Deny" />
                </Group>
            </Radio.Group>

            <Button
                onClick={handleSubmitReview}
                disabled={isSubmitDisabled}
                variant="filled"
                color={userReview ? "info" : "success"}
                loading={submitReviewMutation.isPending}
                leftSection={<FontAwesomeIcon icon={userReview ? "edit" : "check"} />}>
                {userReview ? "Update Review" : "Submit Review"}
            </Button>
        </Stack>
    );
}
