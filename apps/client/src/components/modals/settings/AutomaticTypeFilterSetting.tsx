import { Group, Switch, Text } from "@mantine/core";
import { useLocalPreference } from "../../../hooks/useLocalPreferences";

export default function AutomaticTypeFilterSetting() {
    const [automaticTypeFilter, setAutomaticTypeFilter] = useLocalPreference<boolean>("automatic_type_filter", true);

    return (
        <Group justify="space-between">
            <div>
                <Text size="sm" fw={500}>
                    Automatically apply type filter based on role
                </Text>
                <Text size="xs" c="dimmed">
                    Filter things to tournaments or contests by default
                </Text>
            </div>
            <Switch
                checked={automaticTypeFilter}
                onChange={(event) => setAutomaticTypeFilter(event.currentTarget.checked)}
            />
        </Group>
    );
}
