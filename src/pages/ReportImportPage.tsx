import { useState } from "react";
import { Stack, Title, Card, Button, Alert, FileInput } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { useImportReports } from "../hooks/useTickets";

export default function ReportImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const importReportsMutation = useImportReports();

    const handleSubmit = async () => {
        try {
            setError(null);

            if (!file) {
                setError("Please select a JSON file");
                return;
            }

            // Create form data
            const formData = new FormData();
            formData.append("file", file);

            // Send to backend
            await importReportsMutation.mutateAsync(formData);
            navigate("/reports");
        } catch (e) {
            setError(e instanceof Error ? e.message : "An error occurred while importing reports");
        }
    };

    return (
        <Stack gap="md">
            <Title>Import Reports</Title>

            <Card shadow="sm" p="lg" radius="md">
                <Stack gap="md">
                    {error && (
                        <Alert color="red" title="Error" icon={<FontAwesomeIcon icon="exclamation-circle" />}>
                            {error}
                        </Alert>
                    )}

                    <FileInput
                        label="JSON File"
                        description="Upload a JSON file containing the reports to import"
                        placeholder="Select file..."
                        accept="application/json"
                        value={file}
                        onChange={setFile}
                        leftSection={<FontAwesomeIcon icon="file-code" />}
                        clearable
                    />

                    <Button
                        onClick={handleSubmit}
                        loading={importReportsMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="file-import" />}
                        disabled={!file}>
                        Import Reports
                    </Button>
                </Stack>
            </Card>
        </Stack>
    );
}
