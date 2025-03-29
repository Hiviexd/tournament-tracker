import { Paper, Title, Stack, Group, Text, Button, Divider } from "@mantine/core";
import { ITournament } from "../../../interfaces/Tournament";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserDisplay from "@components/common/UserDisplay";
import TournamentReviewInput from "./TournamentReviewInput";

interface IProps {
    tournament: ITournament;
}

export default function TournamentReviewSection({ tournament }: IProps) {
    // TODO: Implement assign reviewers mutation
    const handleAssignReviewers = () => {
        console.log("Assign reviewers");
    };

    if (tournament.status !== "reviewOngoing" && !tournament.assignedReviewers?.length) {
        return null;
    }

    return (
        <Paper radius="md" p="lg">
            <Stack gap="lg">
                <Title order={3}>Review Information</Title>

                <Stack gap="md">
                    {tournament.assignedReviewers?.length ? (
                        <Stack gap="xs">
                            <Text size="sm" fw={500}>
                                Assigned Reviewers
                            </Text>
                            <Group gap="xl">
                                {tournament.assignedReviewers.map((reviewer) => (
                                    <UserDisplay key={reviewer._id} user={reviewer} />
                                ))}
                            </Group>
                            <Divider my="lg" />

                            <Title order={4}>Review Input</Title>
                            <TournamentReviewInput tournament={tournament} />
                        </Stack>
                    ) : tournament.status === "reviewOngoing" ? (
                        <Button
                            variant="light"
                            color="info"
                            onClick={handleAssignReviewers}
                            leftSection={<FontAwesomeIcon icon="user-group" />}>
                            Assign Reviewers
                        </Button>
                    ) : null}
                </Stack>
            </Stack>
        </Paper>
    );
}
