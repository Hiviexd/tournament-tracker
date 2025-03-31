import { Card, Stack, Group, Button, Box, Title, Text, Collapse, Divider } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useCreateNote } from "../../hooks/useTournaments";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { ITournament } from "../../../interfaces/Tournament";
import { useFileUpload } from "../../hooks/useFileUpload";
import { IMessageFormData } from "../../../interfaces/Message";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import TextLengthIndicator from "../common/TextLengthIndicator";
import FileUploadInput from "../common/FileUploadInput";
import TextEditor from "../common/TextEditor";
import TicketMessage from "../tickets/TicketMessage";
import { useDisclosure } from "@mantine/hooks";

interface IProps {
    tournament: ITournament;
}

export default function TournamentNotes({ tournament }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submissionCount, setSubmissionCount] = useState(0);
    const [opened, { toggle }] = useDisclosure(false);
    const { files, handleFileChange, clearFiles } = useFileUpload();
    const createNoteMutation = useCreateNote(tournament._id);
    const autoSaveKey = `tournament-note-${tournament._id}`;

    const validateNote = (note: string): string | null => {
        if (!note.trim()) return "Note is required";
        if (note.length < 10) return "Note must be at least 10 characters";
        if (note.length > 8000) return "Note cannot exceed 8000 characters";
        return null;
    };

    const handleContentChange = (value: string) => {
        setContent(value);
        if (error) setError(null);
    };

    const handleSubmit = async () => {
        const validationError = validateNote(content);
        if (validationError) {
            setError(validationError);
            return;
        }

        const formData = new FormData() as IMessageFormData;
        formData.append("content", content);
        formData.append("isNote", "true");
        files.forEach((file) => formData.append("files", file));

        try {
            await createNoteMutation.mutateAsync(formData);
            clearAutoSavedValue(autoSaveKey);
            setContent("");
            setError(null);
            clearFiles();

            // force a re-render of the TextEditor component to visually clear the content
            setSubmissionCount((count) => count + 1);
        } catch (err) {
            setError("Failed to add note. Please try again.");
        }
    };

    if (!user?.isCommittee) return null;

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="xl">
                <Group justify="space-between" align="center">
                    <Title order={3}>Notes</Title>
                    <Button
                        variant="subtle"
                        onClick={toggle}
                        rightSection={<FontAwesomeIcon icon={opened ? "caret-up" : "caret-down"} />}>
                        {opened ? "Hide Notes" : "Show Notes"}
                    </Button>
                </Group>

                <Collapse in={opened}>
                    <Stack gap="xl">
                        {/* Display existing notes */}
                        {tournament.notes && tournament.notes.length > 0 ? (
                            <Stack gap="md">
                                {tournament.notes.map((note) => (
                                    <TicketMessage key={note._id} message={note} showTrueAuthor={true} />
                                ))}
                            </Stack>
                        ) : (
                            <Text key={tournament._id} c="dimmed" size="sm" fs="italic">
                                No notes yet...
                            </Text>
                        )}

                        <Divider />

                        {/* Note creation form */}
                        <Stack gap="md">
                            <Box>
                                <Box
                                    mb={5}
                                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                        Add Note
                                    </Box>
                                    <TextLengthIndicator length={content.length} maxLength={8000} />
                                </Box>
                                <TextEditor
                                    key={`${tournament._id}-${submissionCount}`}
                                    value={content}
                                    onChange={handleContentChange}
                                    placeholder="Type your note..."
                                    minHeight={120}
                                    className={error ? "error" : ""}
                                    autoSaveKey={autoSaveKey}
                                />
                                {error && (
                                    <Box mt={5} style={{ color: "var(--mantine-color-red-filled)", fontSize: "12px" }}>
                                        {error}
                                    </Box>
                                )}
                            </Box>
                            <FileUploadInput value={files} onChange={handleFileChange} />
                            <Group justify="end" align="center">
                                <Text fs="italic" size="xs" c="dimmed">
                                    Notes are only visible to committee members
                                </Text>
                                <Button
                                    color="info"
                                    onClick={handleSubmit}
                                    loading={createNoteMutation.isPending}
                                    disabled={!!error || !content}
                                    leftSection={<FontAwesomeIcon icon="sticky-note" />}>
                                    Add Note
                                </Button>
                            </Group>
                        </Stack>
                    </Stack>
                </Collapse>
            </Stack>
        </Card>
    );
}
