import { useState, useRef } from "react";
import { Card, Stack, Group, Button, Box, Tooltip } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSendMessage } from "../../hooks/useTickets";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { ITicket } from "@tc/types/Ticket";
import { useFileUpload } from "../../hooks/useFileUpload";
import { IMessageFormData } from "@tc/types/Message";
import { clearAutoSavedValue } from "../../hooks/useAutoSave";
import TextLengthIndicator from "../common/TextLengthIndicator";
import FileUploadInput from "../common/FileUploadInput";
import TextEditor, { TextEditorRef } from "../common/TextEditor";
import { TemplateSelect } from "../templates/TemplateSelect";
import { ITemplate } from "@tc/types/Template";
import { useConfirmModal } from "../../hooks/useModals";

interface IProps {
    ticket: ITicket;
}

export default function TicketMessageForm({ ticket }: IProps) {
    const [user] = useAtom(loggedInUserAtom);
    const [content, setContent] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submissionCount, setSubmissionCount] = useState(0);
    const { files, handleFileChange, clearFiles } = useFileUpload();
    const createMessageMutation = useSendMessage(ticket.id);
    const autoSaveKey = `ticket-message-${ticket.id}`;
    const textEditorRef = useRef<TextEditorRef>(null);
    const confirmModal = useConfirmModal();

    const validateMessage = (message: string): string | null => {
        if (!message.trim()) return "Message is required";
        if (message.length < 10) return "Message must be at least 10 characters";
        if (message.length > 8000) return "Message cannot exceed 8000 characters";
        return null;
    };

    const getPlaceholder = () => {
        if (!ticket.isActive && !user?.isCommittee) return "Cannot message closed tickets";
        if (!ticket.isActive && user?.isCommittee) return "Type your note...";
        return "Type your message...";
    };

    const handleContentChange = (value: string) => {
        setContent(value);
        if (error) setError(null);
    };

    const handleTemplateSelect = (template: ITemplate) => {
        if (textEditorRef.current) {
            textEditorRef.current.insertText(template.content);
        }
    };

    const handleSubmit = async (isNote: boolean) => {
        const validationError = validateMessage(content);
        if (validationError) {
            setError(validationError);
            return;
        }

        // SAFETY: FormData is the runtime type; message fields are appended before submit.
        const formData = new FormData() as IMessageFormData;
        formData.append("content", content);
        formData.append("isNote", isNote.toString());
        formData.append("content", content);
        formData.append("isNote", isNote.toString());
        files.forEach((file) => formData.append("files", file));

        if (user?.isCommittee) {
            const confirmed = await confirmModal({
                title: `${isNote ? "Add a Note" : "Send a Message"}?`,
                text: `Are you sure you want to ${isNote ? "add a note" : "send a message"}? Please double check your selection just in case.`,
                confirmText: isNote ? "Add Note" : "Send Message",
                confirmProps: {
                    color: isNote ? "info" : "primary",
                    leftSection: <FontAwesomeIcon icon={isNote ? "sticky-note" : "paper-plane"} />,
                },
            });
            if (!confirmed) return;
        }

        try {
            await createMessageMutation.mutateAsync(formData);
            clearAutoSavedValue(autoSaveKey);
            setContent("");
            setError(null);
            clearFiles();

            // force a re-render of the TextEditor component to visually clear the content
            setSubmissionCount((count) => count + 1);
        } catch {
            setError("Failed to send message. Please try again.");
        }
    };

    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Box>
                    <Box mb={5} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Group gap="sm">
                            <Box component="label" style={{ fontWeight: 500, fontSize: "14px" }}>
                                Message
                            </Box>
                        </Group>
                        <TextLengthIndicator length={content.length} maxLength={8000} />
                    </Box>
                    <TextEditor
                        ref={textEditorRef}
                        key={`${ticket.id}-${submissionCount}`}
                        value={content}
                        onChange={handleContentChange}
                        placeholder={getPlaceholder()}
                        disabled={!ticket.isActive && !user?.isCommittee}
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
                    {user?.isCommittee && (
                        <>
                            <TemplateSelect
                                onTemplateSelect={handleTemplateSelect}
                                buttonProps={{ variant: "light" }}
                            />
                            <Tooltip label="Notes are only visible to committee members">
                                <Button
                                    color="info"
                                    onClick={() => handleSubmit(true)}
                                    loading={createMessageMutation.isPending}
                                    disabled={!!error || !content}
                                    leftSection={<FontAwesomeIcon icon="sticky-note" />}>
                                    Add Note
                                </Button>
                            </Tooltip>
                        </>
                    )}
                    <Button
                        color="primary"
                        onClick={() => handleSubmit(false)}
                        loading={createMessageMutation.isPending}
                        disabled={!!error || !content || !ticket.isActive}
                        leftSection={<FontAwesomeIcon icon="paper-plane" />}>
                        Send Message
                    </Button>
                </Group>
            </Stack>
        </Card>
    );
}
