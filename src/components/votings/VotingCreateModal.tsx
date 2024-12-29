import {
    Modal,
    TextInput,
    Stack,
    Select,
    MultiSelect,
    Textarea,
    NumberInput,
    Button,
    Group,
    LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { VotingCategory } from "../../../interfaces/Voting";
import { UserGroup } from "../../../interfaces/User";
import { useCreateVoting } from "../../hooks/useVotings";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function VotingCreateModal({ opened, onClose }: IProps) {
    const createVotingMutation = useCreateVoting();

    const form = useForm({
        initialValues: {
            title: "",
            description: "",
            category: "" as VotingCategory,
            assignedGroups: [] as UserGroup[],
            duration: 7,
            options: ["Yes", "No"], // Default options
        },
        validate: {
            title: (value) => (!value ? "Title is required" : null),
            description: (value) => (!value ? "Description is required" : null),
            category: (value) => (!value ? "Category is required" : null),
            assignedGroups: (value) =>
                value.length === 0 ? "At least one group is required" : null,
            duration: (value) => (value < 1 ? "Duration must be at least 1 day" : null),
            options: (value) => (value.length < 2 ? "At least two options are required" : null),
        },
    });

    const handleSubmit = async (values) => {
        await createVotingMutation.mutateAsync(values);
        form.reset();
        onClose();
    };

    const categoryOptions = [
        { value: "tournament", label: "Tournament" },
        { value: "user", label: "User" },
        { value: "discussion", label: "Discussion" },
    ];

    const groupOptions = [
        { value: "tc", label: "Tournament Committee" },
        { value: "cc", label: "Contest Committee" },
    ];

    return (
        <Modal opened={opened} onClose={onClose} title="Create New Voting" size="lg">
            <LoadingOverlay
                visible={createVotingMutation.isPending}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
            />
            <form onSubmit={form.onSubmit(handleSubmit)} style={{ position: "relative" }}>
                <Stack gap="md">
                    <TextInput
                        label="Title"
                        placeholder="Enter voting title"
                        withAsterisk
                        {...form.getInputProps("title")}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Enter voting description"
                        withAsterisk
                        minRows={3}
                        {...form.getInputProps("description")}
                    />

                    <Select
                        label="Category"
                        placeholder="Select voting category"
                        data={categoryOptions}
                        withAsterisk
                        {...form.getInputProps("category")}
                    />

                    <MultiSelect
                        label="Assigned Groups"
                        placeholder="Select assigned groups"
                        data={groupOptions}
                        withAsterisk
                        {...form.getInputProps("assignedGroups")}
                    />

                    <NumberInput
                        label="Duration (days)"
                        placeholder="Enter duration in days"
                        withAsterisk
                        min={1}
                        {...form.getInputProps("duration")}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={createVotingMutation.isPending}>
                            Create Voting
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}

// TODO: implement missing fields (options, targetUser, targetTournament)