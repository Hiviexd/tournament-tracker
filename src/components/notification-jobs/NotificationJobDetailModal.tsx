import { Badge, Divider, Group, Modal, ScrollArea, Stack, Text } from "@mantine/core";
import { INotificationJobListItem } from "../../../interfaces/NotificationJob";
import dayjs from "../../../utils/dayjs";
import { CSSProperties } from "react";

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
    return (
        <Modal opened={opened} onClose={onClose} title="Notification Job Details" size="xl">
            {!job ? null : (
                <Stack gap="sm">
                    <Group justify="space-between" align="center">
                        <Text fw={600} size="sm">
                            {job.provider}.{job.kind}
                        </Text>
                        <JobStatusBadge status={job.status} />
                    </Group>

                    <Text size="sm" c="dimmed">
                        Attempts: {job.attempts}/{job.maxAttempts}
                    </Text>
                    <Text size="sm" c="dimmed">
                        Last HTTP Status: {job.lastHttpStatus ?? "N/A"}
                    </Text>
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
