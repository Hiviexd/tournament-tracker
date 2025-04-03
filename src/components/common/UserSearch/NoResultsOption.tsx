import { Group, Text, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    search: string;
    onAdd: () => void;
    isLoading: boolean;
    allowUserCreation?: boolean;
}

export default function NoResultsOption({ search, onAdd, isLoading, allowUserCreation = true }: IProps) {
    return (
        <Group p="xs" justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed">
                No users found matching "{search}"
            </Text>
            {allowUserCreation && (
                <Button
                    style={{ flexShrink: 0 }}
                    variant="light"
                    size="xs"
                    onClick={onAdd}
                    leftSection={<FontAwesomeIcon icon="plus" />}
                    loading={isLoading}>
                    Add User
                </Button>
            )}
        </Group>
    );
}
