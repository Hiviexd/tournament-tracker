import { Stack, Text, Divider, Badge, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IInfringement } from "@tc/types/Infringement";
import { IUser } from "@tc/types/User";
import InfringementCard from "./InfringementCard";
import EmptyState from "../common/EmptyState";
import { useState } from "react";
import { useAtomValue } from "jotai";
import InfringementEditModal from "./InfringementEditModal";
import AlertText from "../common/AlertText";
import { useConfirmModal } from "../../hooks/useModals";
import { useDeleteInfringement } from "../../hooks/useInfringements";
import { loggedInUserAtom } from "../../store/atoms";

interface IProps {
    user: IUser;
}

export default function UserInfringementsList({ user }: IProps) {
    const loggedInUser = useAtomValue(loggedInUserAtom);
    const confirmModal = useConfirmModal();
    const deleteInfringementMutation = useDeleteInfringement();

    const infringements = user?.infringements ?? [];
    const activeInfringement = user?.activeInfringement;

    const [editInfringementModalOpened, { open: openEditInfringementModal, close: closeEditInfringementModal }] =
        useDisclosure(false);
    const [selectedInfringement, setSelectedInfringement] = useState<IInfringement | null>(null);

    // Exclude active infringement
    const historicalInfringements = infringements
        .filter((infringement) => infringement.id !== activeInfringement?.id)
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

    if (!user || infringements.length === 0) {
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

    const handleDeleteInfringement = async (infringement: IInfringement) => {
        if (
            !(await confirmModal({
                preset: "delete",
                title: "Delete Infringement?",
                children: (
                    <Stack gap="sm">
                        <Text size="sm">
                            This permanently removes this {infringement.typeString} from the watchlist.
                        </Text>
                        <AlertText type="warning">
                            Any osu! announcement stays sent, and a linked sanction vote stays marked as applied.
                            Only proceed if you REALLY know what you're doing.
                        </AlertText>
                    </Stack>
                ),
            }))
        )
            return;

        await deleteInfringementMutation.mutateAsync(infringement.id!);
    };

    const onDelete = loggedInUser?.isAdmin ? handleDeleteInfringement : undefined;

    return (
        <Stack gap="md">
            <Group gap="xs" align="baseline">
                <Text size="lg" fw={600} className="header-border-left">
                    Infringements
                </Text>
                <Badge variant="light" color="primary">
                    {infringements.length}
                </Badge>
            </Group>

            {activeInfringement && (
                <>
                    <Text size="md" fw={500} className="header-border-left">
                        Active Infringement
                    </Text>
                    <InfringementCard
                        infringement={activeInfringement}
                        onEdit={handleEditInfringement}
                        onDelete={onDelete}
                    />
                </>
            )}

            {historicalInfringements.length > 0 && (
                <>
                    {activeInfringement && <Divider />}
                    <Text size="md" fw={500} className="header-border-left">
                        History
                    </Text>
                    <Stack gap="sm">
                        {historicalInfringements.map((infringement) => (
                            <InfringementCard
                                key={`${infringement.type}-${infringement.createdAt}`}
                                infringement={infringement}
                                onEdit={handleEditInfringement}
                                onDelete={onDelete}
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
