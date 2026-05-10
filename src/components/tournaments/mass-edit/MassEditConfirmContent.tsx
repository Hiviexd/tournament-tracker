import { List, ScrollArea, Stack, Text } from "@mantine/core";
import { type ReactNode } from "react";

interface MassEditConfirmContentProps {
    summary: ReactNode;
    tournaments: { id: string; name: string }[];
}

export default function MassEditConfirmContent({ summary, tournaments }: MassEditConfirmContentProps) {
    return (
        <Stack gap="sm">
            <Text size="sm">{summary}</Text>
            <Text size="sm" fw={500}>
                Tournaments affected:
            </Text>
            <ScrollArea.Autosize mah={220} offsetScrollbars>
                <List size="sm" spacing={4}>
                    {tournaments.map((tournament) => (
                        <List.Item key={tournament.id}>{tournament.name}</List.Item>
                    ))}
                </List>
            </ScrollArea.Autosize>
        </Stack>
    );
}
