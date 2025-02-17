// Components
import { Stack, Text, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IEmptyStateProps {
    icon: IconProp;
    title: string;
    description?: string;
    returnLink?: string;
    returnText?: string;
}

export default function EmptyState({ icon, title, description, returnLink, returnText }: IEmptyStateProps) {
    return (
        <Stack align="center" justify="center" h={200}>
            <FontAwesomeIcon icon={icon} size="2x" style={{ opacity: 0.5 }} />
            <Text size="lg" c="dimmed">
                {title}
            </Text>
            {description && (
                <Text size="sm" c="dimmed">
                    {description}
                </Text>
            )}
            {returnLink && (
                <Button component={Link} to={returnLink} variant="subtle" mt="sm">
                    {returnText || "Go back"}
                </Button>
            )}
        </Stack>
    );
}
