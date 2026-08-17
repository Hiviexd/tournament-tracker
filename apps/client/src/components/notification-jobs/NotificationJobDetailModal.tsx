import { Badge, Button, Divider, Group, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { INotificationJobListItem } from "@tc/types/NotificationJob";
import dayjs from "@tc/utils/dayjs";
import { useAtom } from "jotai";
import { CSSProperties } from "react";
import { useRetryNotificationJob } from "../../hooks/useDebug";
import { useConfirmModal } from "../../hooks/useModals";
import { loggedInUserAtom } from "../../store/atoms";

interface IProps {
    job: INotificationJobListItem | null;
    opened: boolean;
    onClose: () => void;
}

const preStyle: CSSProperties = {
    margin: 0,
    padding: "0.65rem",
    borderRadius: "8px",
    border: "1px solid var(--mantine-color-primary-5)",
    background: "var(--mantine-color-primary-11)",
    color: "var(--mantine-color-gray-2)",
    fontSize: "0.8rem",
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
};

function JobStatusBadge({ status }: { status: INotificationJobListItem["status"] }) {
    const colorMap = {
        pending: "yellow",
        processing: "info",
        sent: "success",
        failed: "danger",
    } as const;

    return (
        <Badge color={colorMap[status] || "gray"} variant="light">
            {status}
        </Badge>
    );
}

export default function NotificationJobDetailModal({ job, opened, onClose }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const retryMutation = useRetryNotificationJob();
    const confirmModal = useConfirmModal();

    const handleRetry = async () => {
        if (!job) return;

        const confirmed = await confirmModal({
            title: "Retry notification job?",
            text: "This will requeue the job for dispatch. If it already sent, the notification will be sent again.",
            confirmText: "Retry",
            confirmProps: { leftSection: <FontAwesomeIcon icon="rotate" /> },
        });
        if (!confirmed) return;

        retryMutation.mutate(job.id || job._id, { onSuccess: onClose });
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Notification Job Details" size="xl">
            {!job ? null : (
                <Stack gap="sm">
                    <Group justify="space-between" align="center">
                        <Text fw={600} size="sm">
                            {job.provider}.{job.kind}
                        </Text>
                        <Group gap="xs">
                            <JobStatusBadge status={job.status} />
                            {user?.isDev && (
                                <Button
                                    size="xs"
                                    variant="light"
                                    leftSection={<FontAwesomeIcon icon="rotate" />}
                                    loading={retryMutation.isPending}
                                    onClick={handleRetry}>
                                    Retry
                                </Button>
                            )}
                        </Group>
                    </Group>

                    <Text size="sm" c="dimmed">
                        Attempts: {job.attempts}/{job.maxAttempts}
                    </Text>
                    <Text size="sm" c="dimmed">
                        Last HTTP Status: {job.lastHttpStatus ?? "N/A"}
                    </Text>
                    {"userIds" in job.payload && (
                        <Text size="sm" c="dimmed">
                            Sent To: {job.payload.sentTo?.length ? job.payload.sentTo.join(", ") : "N/A"}
                        </Text>
                    )}
                    <Text size="sm" c="dimmed">
                        Created: {dayjs(job.createdAt).format("LLL")}
                    </Text>
                    <Text size="sm" c="dimmed">
                        Updated: {dayjs(job.updatedAt).format("LLL")}
                    </Text>

                    <Divider />

                    <Stack gap={4}>
                        <Text size="sm" fw={600}>
                            Last Error
                        </Text>
                        <ScrollArea.Autosize mah={160} offsetScrollbars>
                            <pre style={preStyle}>{job.lastError || "No error message available."}</pre>
                        </ScrollArea.Autosize>
                    </Stack>

                    <Stack gap={4}>
                        <Text size="sm" fw={600}>
                            Payload
                        </Text>
                        <ScrollArea.Autosize mah={320} offsetScrollbars>
                            <pre style={preStyle}>{JSON.stringify(job.payload, null, 2)}</pre>
                        </ScrollArea.Autosize>
                    </Stack>
                </Stack>
            )}
        </Modal>
    );
}
