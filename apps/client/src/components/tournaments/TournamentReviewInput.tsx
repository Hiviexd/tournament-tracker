import { Stack, Checkbox, Radio, Group, Button, Text, Alert, Collapse, Loader, Center } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ITournament } from "@tc/types/Tournament";
import { IChecklistCategory } from "@tc/types/Checklist";
import { REVIEW_VOTE_TYPES } from "@tc/types/Review";
import { useState, useMemo, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ExpandButton from "../common/buttons/ExpandButton";
import { useSubmitReview } from "../../hooks/useTournaments";
import { isReviewChecklists, useReviewChecklists } from "../../hooks/useChecklist";
import { loggedInUserAtom } from "../../store/atoms";
import { useAtom } from "jotai";
import { pickStringUnion } from "@tc/utils/client";
import TextEditor from "../common/TextEditor";
import ReviewStatusBanner from "../common/banners/ReviewStatusBanner";
import { useAutoSave, clearAutoSavedValue } from "../../hooks/useAutoSave";

interface IProps {
    tournament: ITournament;
}

type ChecklistState = Record<string, boolean>;

export default function TournamentReviewInput({ tournament }: IProps) {
    const { data: checklists, isLoading, isError } = useReviewChecklists();

    if (isLoading) {
        return (
            <Center py="xl">
                <Loader size="sm" />
            </Center>
        );
    }

    if (isError || !isReviewChecklists(checklists)) {
        return (
            <Alert
                color="danger"
                icon={<FontAwesomeIcon icon="exclamation-triangle" />}
                title="Failed to load checklist">
                Could not load the review checklist. Please refresh and try again.
            </Alert>
        );
    }

    const reviewChecklist = tournament.isTournament ? checklists.tc : checklists.cc;

    return <TournamentReviewForm tournament={tournament} reviewChecklist={reviewChecklist} />;
}

interface IFormProps {
    tournament: ITournament;
    reviewChecklist: IChecklistCategory[];
}

function TournamentReviewForm({ tournament, reviewChecklist }: IFormProps) {
    const [user] = useAtom(loggedInUserAtom);
    const userReview = tournament.reviews?.find((review) => review.author?.id === user?.id);
    const autoSaveKey = `tournament-review-${tournament._id}`;
    const checklistAutoSaveKey = `tournament-review-checklist-${tournament._id}`;

    const getDefaultChecklistState = useCallback(() => {
        const initialState: ChecklistState = {};

        for (const category of reviewChecklist) {
            for (const item of category.items) {
                initialState[item] = false;
            }
        }

        if (userReview?.checklist) {
            for (const item of userReview.checklist) {
                initialState[item.item] = item.checked;
            }
        }

        return initialState;
    }, [reviewChecklist, userReview?.checklist]);

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

    const allItems = reviewChecklist.flatMap((category) => category.items);

    const checkedItems = allItems.filter((item) => checkedState[item]);
    const allChecked = allItems.length > 0 && checkedItems.length === allItems.length;
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

    const hasUnsavedChanges = useMemo(() => {
        if (!userReview) {
            const defaultState = getDefaultChecklistState();
            const hasChecklistChanges = JSON.stringify(checkedState) !== JSON.stringify(defaultState);
            const hasCommentChanges = comment.trim() !== "";
            const hasDecisionChanges = decision !== null;
            return hasChecklistChanges || hasCommentChanges || hasDecisionChanges;
        }

        const savedChecklist: ChecklistState = {};
        for (const item of userReview.checklist) {
            savedChecklist[item.item] = item.checked;
        }

        const hasChecklistChanges = JSON.stringify(checkedState) !== JSON.stringify(savedChecklist);
        const hasCommentChanges = comment !== (userReview.comment || "");
        const hasDecisionChanges = decision !== userReview.vote;

        return hasChecklistChanges || hasCommentChanges || hasDecisionChanges;
    }, [checkedState, comment, decision, userReview, getDefaultChecklistState]);

    const [opened, { toggle }] = useDisclosure(hasUnsavedChanges);

    return (
        <Stack gap="md">
            <ReviewStatusBanner tournament={tournament} user={user ?? null} />

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
            <Collapse expanded={opened}>
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

                    {reviewChecklist.map((category) => (
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
                onChange={(value) => {
                    const next = pickStringUnion(value, REVIEW_VOTE_TYPES);
                    setDecision(next ?? null);
                }}
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
