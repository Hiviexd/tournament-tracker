import { TextInput, Stack, Select, SimpleGrid } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { UseFormReturnType } from "@mantine/form";
import dayjs from "@tc/utils/dayjs";
import MultiSelect from "../../common/MultiSelect";
import MultipleUsersInput from "../../common/MultipleUsersInput";
import { isString } from "@tc/utils/client";
import { IUser } from "@tc/types/User";
import { TournamentCreateFormValues } from "./tournamentCreateForm";

const modeOptions = [
    { value: "osu", label: "osu!" },
    { value: "taiko", label: "osu!taiko" },
    { value: "catch", label: "osu!catch" },
    { value: "mania", label: "osu!mania" },
];

const typeOptions = [
    { value: "tournament", label: "Tournament" },
    { value: "contest", label: "Contest" },
];

interface IProps {
    form: UseFormReturnType<TournamentCreateFormValues>;
    selectedHosts: IUser[];
    onHostsChange: (hosts: IUser[]) => void;
}

export default function TournamentCreateBasicsStep({ form, selectedHosts, onHostsChange }: IProps) {
    return (
        <Stack gap="md" mt="md">
            <TextInput
                label="Tournament Name"
                placeholder="Enter tournament name..."
                {...form.getInputProps("name")}
                withAsterisk
            />

            <MultipleUsersInput
                value={selectedHosts}
                onChange={onHostsChange}
                label="Hosts"
                placeholder="Search for a host to add..."
                required
                error={isString(form.errors.hostIds) ? form.errors.hostIds : undefined}
                allowUserCreation
                showActiveInfringementWarning
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <MultiSelect
                    label="Game Modes"
                    placeholder="Select game modes"
                    data={modeOptions}
                    {...form.getInputProps("modes")}
                    withAsterisk
                />

                <Select
                    label="Type"
                    placeholder="Select type"
                    data={typeOptions}
                    {...form.getInputProps("type")}
                    withAsterisk
                />
            </SimpleGrid>

            <DatePickerInput
                type="range"
                label="Start & End Dates"
                placeholder="Select start and end date range"
                clearable
                withAsterisk
                value={[form.values.startDate, form.values.endDate]}
                onChange={(value) => {
                    const [start, end] = value ?? [null, null];
                    form.setFieldValue("startDate", start ? dayjs(start).toDate() : null);
                    form.setFieldValue("endDate", end ? dayjs(end).toDate() : null);
                }}
                error={form.errors.startDate || form.errors.endDate}
            />

            <TextInput label="Forum Link" placeholder="Enter forum URL..." {...form.getInputProps("forumUrl")} />

            <TextInput
                label="Banner URL"
                placeholder="Enter banner image URL..."
                {...form.getInputProps("bannerUrl")}
            />

            <TextInput
                label="Enchant URL"
                placeholder="Enter enchant ticket URL..."
                {...form.getInputProps("enchantUrl")}
            />
        </Stack>
    );
}
