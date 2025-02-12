import { UseFormReturnType } from "@mantine/form";
import { Stack, TextInput, Textarea, Select } from "@mantine/core";
import { ITicketFormValues } from "../../pages/TicketCreatePage";

const GROUP_OPTIONS = [
    { value: "tc", label: "Tournament Committee" },
    { value: "cc", label: "Content Committee" },
] as const;

interface IProps {
    form: UseFormReturnType<ITicketFormValues>;
    onSubmit: (values: ITicketFormValues) => void;
}

export default function TicketForm({ form }: IProps) {
    return (
        <Stack gap="md">
            <Select
                label="Contact Group"
                placeholder="Select which committee to contact"
                data={GROUP_OPTIONS}
                {...form.getInputProps("assignedGroup")}
                withAsterisk
            />

            <TextInput label="Title" placeholder="Enter ticket title" {...form.getInputProps("title")} withAsterisk />

            <Textarea
                label="Message"
                placeholder="Enter your message"
                minRows={4}
                {...form.getInputProps("message")}
                withAsterisk
            />
        </Stack>
    );
}
