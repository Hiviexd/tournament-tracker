import { Stack, Text, Divider, Badge, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IInfringement, IUser } from "../../../interfaces/User";
import InfringementCard from "./InfringementCard";
import EmptyState from "../common/EmptyState";
import { useState } from "react";
import InfringementEditModal from "./InfringementEditModal";

interface IProps {
    user: IUser;
}

export default function UserInfringementsList({ user }: IProps) {
    const activeInfringement = user.activeInfringement;

    const [editInfringementModalOpened, { open: openEditInfringementModal, close: closeEditInfringementModal }] =
        useDisclosure(false);
    const [selectedInfringement, setSelectedInfringement] = useState<IInfringement | null>(null);

    // Exclude active infringement
    const historicalInfringements = user.infringements
        // filter by id
        .filter((infringement) => infringement.id !== activeInfringement?.id)
        .sort((a, b) => {
            // Sort by creation date (most recent first)
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

    if (!user.infringements || user.infringements.length === 0) {
        return <EmptyState icon="user-shield" title="No infringements recorded for this user." height={150} />;
    }

    const handleEditInfringement = (infringement: IInfringement) => {
        setSelectedInfringement(infringement);
        openEditInfringementModal();
    };

    const handleCloseEditInfringementModal = () => {
        setSelectedInfringement(null);
        closeEditInfringementModal();
    };

    return (
        <Stack gap="md">
            <Group gap="xs" align="baseline">
                <Text size="lg" fw={600} className="header-border-left">
                    Infringements
                </Text>
                <Badge variant="light" color="primary">
                    {user.infringements.length}
                </Badge>
            </Group>

            {activeInfringement && (
                <>
                    <Text size="md" fw={500} className="header-border-left">
                        Active Infringement
                    </Text>
                    <InfringementCard
                        infringement={activeInfringement}
                        isActive={true}
                        onEdit={handleEditInfringement}
                    />
                </>
            )}

            {historicalInfringements.length > 0 && (
                <>
                    {activeInfringement && <Divider />}
                    <Text size="md" fw={500} className="header-border-left">
                        Infringement History
                    </Text>
                    <Stack gap="sm">
                        {historicalInfringements.map((infringement) => (
                            <InfringementCard
                                key={`${infringement.type}-${infringement.createdAt}`}
                                infringement={infringement}
                                isActive={false}
                                onEdit={handleEditInfringement}
                            />
                        ))}
                    </Stack>
                </>
            )}

            <InfringementEditModal
                opened={editInfringementModalOpened}
                onClose={handleCloseEditInfringementModal}
                infringement={selectedInfringement}
                userId={user.id}
            />
        </Stack>
    );
}
