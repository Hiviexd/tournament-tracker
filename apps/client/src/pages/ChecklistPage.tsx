import { Alert, Card, Divider, Group, Skeleton, Stack, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IReviewChecklists } from "@tc/types/Checklist";
import { isReviewChecklists, useReviewChecklists } from "../hooks/useChecklist";
import { loggedInUserAtom } from "../store/atoms";
import ChecklistEditor from "../components/checklist/ChecklistEditor";
import EmptyState from "../components/common/EmptyState";

const EMPTY_CHECKLISTS: IReviewChecklists = { tc: [], cc: [] };

function ChecklistLoadingState() {
    return (
        <Stack gap="lg">
            {[1, 2].map((section) => (
                <Stack key={section} gap="md">
                    <Skeleton height={24} width="30%" />
                    {[1, 2].map((card) => (
                        <Card key={card} shadow="sm" p="lg" radius="md">
                            <Stack gap="md">
                                <Group justify="space-between">
                                    <Skeleton height={36} style={{ flex: 1 }} />
                                    <Skeleton height={32} width={32} circle />
                                </Group>
                                <Divider />
                                {[1, 2, 3].map((row) => (
                                    <Skeleton key={row} height={44} radius="md" />
                                ))}
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            ))}
        </Stack>
    );
}

export default function ChecklistPage() {
    const [user] = useAtom(loggedInUserAtom);
    const { data, isLoading } = useReviewChecklists();
    const loadFailed = !!data?.error && data.status !== 404;

    return (
        <Stack gap="lg">
            <Alert color="info" icon={<FontAwesomeIcon icon="circle-info" />} title="Info">
                <Text size="sm">
                    {user?.isAdmin
                        ? "Changes apply to new and in-progress review forms. Existing submitted reviews keep the wording the reviewer checked."
                        : "This checklist is read-only. Notify an admin if you need changes."}
                </Text>
            </Alert>

            {isLoading ? (
                <ChecklistLoadingState />
            ) : loadFailed ? (
                <EmptyState
                    icon="clipboard-list"
                    title="Error loading checklist"
                    description="Try refreshing the page"
                />
            ) : (
                <ChecklistEditor initialChecklists={isReviewChecklists(data) ? data : EMPTY_CHECKLISTS} />
            )}
        </Stack>
    );
}
