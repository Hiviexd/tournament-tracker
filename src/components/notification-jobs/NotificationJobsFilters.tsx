import { Card, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { NotificationJobStatus, NotificationProvider } from "../../../interfaces/NotificationJob";

export interface NotificationJobFiltersValues {
    kind: string;
    payload: string;
    provider: NotificationProvider | "";
    status: NotificationJobStatus | "";
}

interface IProps {
    values: NotificationJobFiltersValues;
    onChange: (values: NotificationJobFiltersValues) => void;
}

const PROVIDER_OPTIONS = [
    { value: "discord", label: "Discord" },
    { value: "osu", label: "osu!" },
];

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "sent", label: "Sent" },
    { value: "failed", label: "Failed" },
];

export default function NotificationJobsFilters({ values, onChange }: IProps) {
    return (
        <Card shadow="sm" p="md">
            <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <TextInput
                        placeholder="Search by job kind..."
                        leftSection={<FontAwesomeIcon icon="search" />}
                        value={values.kind}
                        onChange={(event) => {
                            onChange({ ...values, kind: event.currentTarget.value });
                        }}
                    />
                    <TextInput
                        placeholder="Search in payload content..."
                        leftSection={<FontAwesomeIcon icon="search" />}
                        value={values.payload}
                        onChange={(event) => {
                            onChange({ ...values, payload: event.currentTarget.value });
                        }}
                    />
                </SimpleGrid>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <Select
                        placeholder="Filter by provider"
                        leftSection={<FontAwesomeIcon icon="paper-plane" />}
                        value={values.provider}
                        onChange={(value) => onChange({ ...values, provider: (value as NotificationProvider) || "" })}
                        data={PROVIDER_OPTIONS}
                        clearable
                    />
                    <Select
                        placeholder="Filter by status"
                        leftSection={<FontAwesomeIcon icon="rotate" />}
                        value={values.status}
                        onChange={(value) => onChange({ ...values, status: (value as NotificationJobStatus) || "" })}
                        data={STATUS_OPTIONS}
                        clearable
                    />
                </SimpleGrid>
            </Stack>
        </Card>
    );
}
