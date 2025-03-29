import { Paper, Title, Text } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";

interface IProps {
    tournament: ITournament;
}

export default function TournamentReviewSection({ tournament }: IProps) {
    return (
        <Paper radius="md" p="lg">
            <Title order={3}>Reviews</Title>
            <Text c="dimmed" mt="md">
                TODO: Implement review section
            </Text>
        </Paper>
    );
}
