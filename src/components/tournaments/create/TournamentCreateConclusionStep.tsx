import { Stack, TextInput } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import MultipleUsersInput from "../../common/MultipleUsersInput";
import FileUploadInput from "../../common/FileUploadInput";
import { IUser } from "../../../../interfaces/User";
import { TournamentCreateFormValues, badgeUploadOptions } from "./tournamentCreateForm";

interface IProps {
    form: UseFormReturnType<TournamentCreateFormValues>;
    selectedWinners: IUser[];
    onWinnersChange: (winners: IUser[]) => void;
    files: File[];
    onFilesChange: (files: File[]) => void;
}

export default function TournamentCreateConclusionStep({
    form,
    selectedWinners,
    onWinnersChange,
    files,
    onFilesChange,
}: IProps) {
    return (
        <Stack gap="md" mt="md">
            <MultipleUsersInput
                value={selectedWinners}
                onChange={onWinnersChange}
                label="Winners"
                placeholder="Search for a winner to add..."
                allowUserCreation
                showActiveInfringementWarning
            />

            <FileUploadInput
                value={files}
                onChange={onFilesChange}
                label="Badges"
                description="Badge(s) must be .png and 172x80px"
                placeholder="Up to 8 badges"
                options={badgeUploadOptions}
                accept={[".png"]}
            />

            <TextInput
                label="Discord Thread"
                placeholder="Thread ID or Discord URL..."
                description="Paste a thread ID or full Discord channel/thread link"
                {...form.getInputProps("threadId")}
            />
        </Stack>
    );
}
