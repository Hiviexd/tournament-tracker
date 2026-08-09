import { Stack, Checkbox, Radio, Group, Button, Text, Alert, Collapse } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ITournament } from "@tc/types/Tournament";
import { useState, useMemo, useCallback } from "react";
import { TC_REVIEW_CHECKLIST, CC_REVIEW_CHECKLIST } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ExpandButton from "../common/buttons/ExpandButton";
import { useSubmitReview } from "../../hooks/useTournaments";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import TextEditor from "../common/TextEditor";
import ReviewStatusBanner from "../common/banners/ReviewStatusBanner";
import { useAutoSave, clearAutoSavedValue } from "../../hooks/useAutoSave";

interface IProps {
    tournament: ITournament;
}

type ChecklistState = Record<string, boolean>;

export default function TournamentReviewInput({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const userReview = tournament.reviews?.find((review) => review.author?.id === user?.id);
    const autoSaveKey = `tournament-review-${tournament._id}`;
    const checklistAutoSaveKey = `tournament-review-checklist-${tournament._id}`;
    const REVIEW_CHECKLIST = tournament.isTournament ? TC_REVIEW_CHECKLIST : CC_REVIEW_CHECKLIST;

    // Initialize default state
    const getDefaultChecklistState = useCallback((): ChecklistState => {
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
    }, [REVIEW_CHECKLIST, userReview?.checklist]);

    // Use autosave hook for checklist state
    const { value: checkedState, setValue: setCheckedState } = useAutoSave<ChecklistState>({
        key: checklistAutoSaveKey,
        initialValue: getDefaultChecklistState(),
        debounceMs: 100,
        serialize: (value) => JSON.stringify(value),
        deserialize: (value) => JSON.parse(value),
    });

    const [comment, setComment] = useState(userReview?.comment ?? "");
    const [decision, setDecision] = useState<"approve" | "changesRequested" | "deny" | null>(userReview?.vote ?? null);

    const submitReviewMutation = useSubmitReview(tournament.id);

    // Get all possible checklist items
    const allItems = REVIEW_CHECKLIST.flatMap((category) => category.items);

    // Calculate select all state
    const checkedItems = allItems.filter((item) => checkedState[item]);
    const allChecked = checkedItems.length === allItems.length;
    const indeterminate = checkedItems.length > 0 && checkedItems.length < allItems.length;

    const handleSubmitReview = async () => {
        const reviewData = {
            tournamentId: tournament.id,
            checklist: Object.entries(checkedState).map(([item, checked]) => ({
                item,
                checked: Boolean(checked),
            })),
            comment,
            vote: decision!,
        };

        await submitReviewMutation.mutateAsync(reviewData);

        // Clear autosaved checklist data after successful submission
        clearAutoSavedValue(checklistAutoSaveKey);
    };

    const handleCheckboxChange = (item: string, checked: boolean) => {
        setCheckedState((prev) => ({
            ...prev,
            [item]: checked,
        }));
    };

    const handleSelectAllChange = (checked: boolean) => {
        const newState: ChecklistState = {};
        for (const item of allItems) {
            newState[item] = checked;
        }
        setCheckedState(newState);
    };

    const isSubmitDisabled = !decision || (decision !== "deny" && Object.values(checkedState).every((v) => !v));

    // Check for unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        if (!userReview) {
            // If no existing review, check if there are any changes from default state
            const defaultState = getDefaultChecklistState();
            const hasChecklistChanges = JSON.stringify(checkedState) !== JSON.stringify(defaultState);
            const hasCommentChanges = comment.trim() !== "";
            const hasDecisionChanges = decision !== null;
            return hasChecklistChanges || hasCommentChanges || hasDecisionChanges;
        }

        // If existing review, compare current state with saved state
        const savedChecklist = userReview.checklist.reduce((acc, item) => {
            acc[item.item] = item.checked;
            return acc;
        }, {} as ChecklistState);

        const hasChecklistChanges = JSON.stringify(checkedState) !== JSON.stringify(savedChecklist);
        const hasCommentChanges = comment !== (userReview.comment || "");
        const hasDecisionChanges = decision !== userReview.vote;

        return hasChecklistChanges || hasCommentChanges || hasDecisionChanges;
    }, [checkedState, comment, decision, userReview, getDefaultChecklistState]);

    const [opened, { toggle }] = useDisclosure(hasUnsavedChanges);

    return (
        <Stack gap="md">
            <ReviewStatusBanner tournament={tournament} user={user} />

            {hasUnsavedChanges && (
                <Alert
                    color="yellow"
                    icon={<FontAwesomeIcon icon="exclamation-triangle" />}
                    title="You have unsaved changes. Your progress is automatically saved locally."
                />
            )}

            <Group align="center" gap="xs" mt="xs">
                <Text component="label" fw={700} size="md">
                    Review Checklist
                </Text>
                <ExpandButton radius={1000} size="compact-xs" variant="light" expanded={opened} onClick={toggle} />
            </Group>
            <Collapse in={opened}>
                <Stack gap="md">
                    <Text size="xs" c="dimmed">
                        If something is inapplicable (i.e. not a LAN, no qualifiers, etc.), please mark it as cleared!
                    </Text>

                    <Checkbox
                        label="Select All"
                        checked={allChecked}
                        indeterminate={indeterminate}
                        onChange={(event) => handleSelectAllChange(event.currentTarget.checked)}
                        size="sm"
                        mb="xs"
                    />

                    {REVIEW_CHECKLIST.map((category) => (
                        <Stack key={category.category} gap="xs">
                            <Text fw={400} size="sm" c="dimmed" className="header-border-left">
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
                </Stack>
            </Collapse>

            <Stack gap="xs" mt="md">
                <Text component="label" fw={700} size="md">
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
