import { UseFormReturnType } from "@mantine/form";
import { Stack, TextInput, Textarea } from "@mantine/core";
import { ITicketFormValues } from "../../pages/TicketCreatePage";

interface IProps {
    form: UseFormReturnType<ITicketFormValues>;
    onSubmit: (values: ITicketFormValues) => void;
}

export default function TicketForm({ form }: IProps) {
    return (
        <Stack gap="md">
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
