import { Button, Divider, Group, Stack, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IReviewChecklists } from "@tc/types/Checklist";
import { isReviewChecklists, useUpdateChecklists } from "../../hooks/useChecklist";
import ChecklistListEditor from "./ChecklistListEditor";
import ChecklistImportModal from "./ChecklistImportModal";

interface IProps {
    initialChecklists: IReviewChecklists;
}

function cloneChecklists(checklists: IReviewChecklists): IReviewChecklists {
    return {
        tc: checklists.tc.map((category) => ({ category: category.category, items: [...category.items] })),
        cc: checklists.cc.map((category) => ({ category: category.category, items: [...category.items] })),
    };
}

export default function ChecklistEditor({ initialChecklists }: IProps) {
    const saveMutation = useUpdateChecklists();
    const [importOpened, { open: openImport, close: closeImport }] = useDisclosure(false);
    const form = useForm<IReviewChecklists>({
        initialValues: cloneChecklists(initialChecklists),
    });

    const handleSubmit = async (values: IReviewChecklists) => {
        try {
            const saved = await saveMutation.mutateAsync(values);
            if (isReviewChecklists(saved)) {
                const cloned = cloneChecklists(saved);
                form.setValues(cloned);
                form.resetDirty(cloned);
            }
        } catch (error) {
            console.error("Failed to save checklist:", error);
        }
    };

    const handleImport = (checklists: IReviewChecklists) => {
        const cloned = cloneChecklists(checklists);
        form.setValues(cloned);
        form.setDirty({ tc: true, cc: true });
    };

    return (
        <>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                    <Group grow>
                        <Button
                            type="submit"
                            leftSection={<FontAwesomeIcon icon="save" />}
                            loading={saveMutation.isPending}
                            disabled={!form.isDirty() || saveMutation.isPending}>
                            Save Changes
                        </Button>
                        <Button
                            type="button"
                            variant="light"
                            leftSection={<FontAwesomeIcon icon="upload" />}
                            onClick={openImport}>
                            Paste JSON
                        </Button>
                    </Group>

                    <Divider />

                    <Stack gap="md">
                        <Title order={4} className="header-border-left">
                            Tournaments (TC)
                        </Title>
                        <ChecklistListEditor
                            categories={form.values.tc}
                            onChange={(tc) => form.setFieldValue("tc", tc)}
                        />
                    </Stack>

                    <Stack gap="md">
                        <Title order={4} className="header-border-left">
                            Contests (CC)
                        </Title>
                        <ChecklistListEditor
                            categories={form.values.cc}
                            onChange={(cc) => form.setFieldValue("cc", cc)}
                        />
                    </Stack>
                </Stack>
            </form>

            <ChecklistImportModal
                opened={importOpened}
                onClose={closeImport}
                onImport={handleImport}
                replaceExisting={form.values.tc.length > 0 || form.values.cc.length > 0}
            />
        </>
    );
}
