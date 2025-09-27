import { Stack, Text, Divider, Badge, Group } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import InfringementCard from "./InfringementCard";
import EmptyState from "../common/EmptyState";
import _ from "lodash";

interface IProps {
    user: IUser;
}

export default function UserInfringementsList({ user }: IProps) {
    const activeInfringement = user.activeInfringement;

    // Exclude active infringement
    const historicalInfringements = user.infringements
        .filter((infringement) => !_.isEqual(activeInfringement, infringement))
        .sort((a, b) => {
            // Sort by creation date (most recent first)
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

    if (!user.infringements || user.infringements.length === 0) {
        return <EmptyState icon="user-shield" title="No infringements recorded for this user." height={150} />;
    }

    return (
        <Stack gap="md">
            <Group gap="xs" align="baseline">
                <Text size="lg" fw={600}>
                    Infringements
                </Text>
                <Badge variant="light" color="primary">
                    {user.infringements.length}
                </Badge>
            </Group>

            {activeInfringement && (
                <>
                    <Text size="md" fw={500}>
                        Active Infringement
                    </Text>
                    <InfringementCard infringement={activeInfringement} isActive={true} />
                </>
            )}

            {historicalInfringements.length > 0 && (
                <>
                    {activeInfringement && <Divider />}
                    <Text size="md" fw={500}>
                        Infringement History
                    </Text>
                    <Stack gap="sm">
                        {historicalInfringements.map((infringement) => (
                            <InfringementCard
                                key={`${infringement.type}-${infringement.createdAt}`}
                                infringement={infringement}
                                isActive={false}
                            />
                        ))}
                    </Stack>
                </>
            )}
        </Stack>
    );
}
