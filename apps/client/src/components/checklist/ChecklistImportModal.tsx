import { Button, Code, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IReviewChecklists } from "@tc/types/Checklist";
import { isReviewChecklists } from "../../hooks/useChecklist";
import { useConfirmModal } from "../../hooks/useModals";

interface IProps {
    opened: boolean;
    onClose: () => void;
    onImport: (checklists: IReviewChecklists) => void;
    replaceExisting?: boolean;
}

const PLACEHOLDER = `{
  "tc": [
    { "category": "Category name", "items": ["Item 1", "Item 2"] }
  ],
  "cc": [
    { "category": "Category name", "items": ["Item 1"] }
  ]
}`;

export default function ChecklistImportModal({ opened, onClose, onImport, replaceExisting = false }: IProps) {
    const confirmModal = useConfirmModal();
    const form = useForm({
        initialValues: { json: "" },
        validate: {
            json: (value) => (!value.trim() ? "JSON is required" : null),
        },
    });

    const handleClose = () => {
        form.reset();
        onClose();
    };

    const handleSubmit = async (values: { json: string }) => {
        let parsed: unknown;
        try {
            parsed = JSON.parse(values.json);
        } catch {
            form.setFieldError("json", "Invalid JSON");
            return;
        }

        if (!isReviewChecklists(parsed)) {
            form.setFieldError("json", 'Expected { "tc": [{ "category": string, "items": string[] }], "cc": [...] }');
            return;
        }

        if (
            replaceExisting &&
            !(await confirmModal({
                title: "Replace checklist?",
                text: "This will replace the current TC and CC checklists in the editor. Save Changes to persist them.",
                confirmText: "Replace",
            }))
        ) {
            return;
        }

        onImport({
            tc: parsed.tc.map((category) => ({ category: category.category, items: [...category.items] })),
            cc: parsed.cc.map((category) => ({ category: category.category, items: [...category.items] })),
        });
        form.reset();
        onClose();
    };

    return (
        <Modal opened={opened} onClose={handleClose} title="Paste checklist JSON" size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Paste a full checklist object with <Code>tc</Code> and <Code>cc</Code> arrays. This updates the
                        editor only — click Save Changes afterwards.
                    </Text>
                    <Textarea
                        autosize
                        minRows={12}
                        maxRows={24}
                        placeholder={PLACEHOLDER}
                        styles={{ input: { fontFamily: "monospace", fontSize: 12 } }}
                        {...form.getInputProps("json")}
                    />
                    <Button type="submit" leftSection={<FontAwesomeIcon icon="upload" />}>
                        Load into editor
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
}
