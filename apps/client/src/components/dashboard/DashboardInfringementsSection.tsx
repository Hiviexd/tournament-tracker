import { useRef } from "react";
import { Stack, Title, SimpleGrid, Card, Group, Badge, Collapse, Tooltip } from "@mantine/core";
import { IUser } from "@tc/types/User";
import EmptyState from "../common/EmptyState";
import InfringementCard from "../watchlist/InfringementCard";
import UserDisplay from "../common/UserDisplay";
import { useDisclosure } from "@mantine/hooks";
import ExpandButton from "../common/buttons/ExpandButton";

interface IProps {
    users: IUser[];
}

export default function DashboardInfringementsSection({ users }: IProps) {
    const totalInfringementsCount = useRef(users.reduce((acc, user) => acc + user.infringements.length, 0));

    const [opened, { toggle }] = useDisclosure(users.length > 0);

    return (
        <Stack gap="md">
            <Group align="center" gap="xs">
                <Title order={3} className="header-border-left">
                    Infringements
                </Title>
                <Tooltip label="Needs Email">
                    <Badge color={totalInfringementsCount.current > 0 ? "orange" : "gray"} variant="light">
                        {totalInfringementsCount.current}
                    </Badge>
                </Tooltip>
                <ExpandButton radius={1000} size="compact-sm" variant="light" expanded={opened} onClick={toggle} />
            </Group>

            <Collapse expanded={opened}>
                <Stack gap="sm">
                    {users.length > 0 && (
                        <Group align="center" gap="xs">
                            <Title order={4} c="orange">
                                Needs Email
                            </Title>
                            <Badge color="orange" variant="light">
                                {totalInfringementsCount.current}
                            </Badge>
                        </Group>
                    )}

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {users.length > 0 &&
                            users.map((user) => (
                                <Card key={user.id} shadow="sm" p="lg">
                                    <Stack gap="sm">
                                        <UserDisplay user={user} />
                                        {user.infringements.length > 0 &&
                                            user.infringements.map((infringement) => (
                                                <InfringementCard
                                                    key={infringement.id}
                                                    infringement={infringement}
                                                    userToNavigateTo={user.osuId}
                                                />
                                            ))}
                                    </Stack>
                                </Card>
                            ))}
                    </SimpleGrid>
                </Stack>

                {users.length === 0 && (
                    <EmptyState
                        height={100}
                        icon="user-shield"
                        title={`All infringements are clear!`}
                        description="some placeholder text change this later"
                    />
                )}
            </Collapse>
        </Stack>
    );
}
