import { Stack, Card, Group, Text, Badge, SimpleGrid, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface ResultSectionProps {
    title: string;
    color: string;
    icon: IconProp;
    items: any[];
    renderItem: (item: any) => JSX.Element;
}

export default function ResultSection({ title, color, icon, items, renderItem }: ResultSectionProps) {
    return (
        <Card shadow="sm" p="lg">
            <Stack gap="md">
                <Group align="center">
                    <Text size="lg" c={color}>
                        <FontAwesomeIcon icon={icon} />
                    </Text>
                    <Title order={4}>{title}</Title>
                    <Badge variant="light">{items.length}</Badge>
                </Group>
                {items.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {items.map(renderItem)}
                    </SimpleGrid>
                ) : (
                    <Text c="dimmed" ta="center" size="sm" py="xl">
                        No beatmaps in this category...
                    </Text>
                )}
            </Stack>
        </Card>
    );
}
