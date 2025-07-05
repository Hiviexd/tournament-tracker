import { Group, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Footer() {
    return (
        <Group gap="xl" align="center" justify="center" mt="lg">
            <Text
                c="primary"
                size="sm"
                component="a"
                href="https://github.com/Hiviexd/tournament-tracker"
                target="_blank">
                <FontAwesomeIcon icon={["fab", "github"]} /> Source Code
            </Text>
            <Text
                c="primary"
                size="sm"
                component="a"
                href="https://github.com/Hiviexd/tournament-tracker/issues/new"
                target="_blank">
                <FontAwesomeIcon icon="bug" /> Report Issues
            </Text>
        </Group>
    );
}
