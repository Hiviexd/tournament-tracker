import { Card, Group, Title, Text, Tooltip, ActionIcon } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { IResource, ResourceCategory } from "../../../interfaces/Resource";
import UserLink from "../common/UserLink";
import _ from "lodash";

const CATEGORY_ICONS: Record<ResourceCategory, IconProp> = {
    discord: ["fab", "discord"],
    tool: "wrench",
    guide: "book",
    spreadsheet: "table",
    article: "newspaper",
};

interface IProps {
    resource: IResource;
    onEdit?: (resource: IResource) => void;
}

export default function ResourcesCard({ resource, onEdit }: IProps) {
    const icon = CATEGORY_ICONS[resource.category];

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent the card's link from activating
        onEdit?.(resource);
    };

    return (
        <Card
            padding="lg"
            radius="md"
            className="feature-card"
            component="a"
            href={resource.link}
            target="_blank"
            rel="noopener noreferrer">
            <Group mb="xs" wrap="nowrap">
                <Tooltip label={_.capitalize(resource.category)}>
                    <FontAwesomeIcon icon={icon} size="lg" style={{ color: "var(--mantine-color-primary-6)" }} />
                </Tooltip>
                <Title order={4} style={{ flex: 1 }}>
                    {resource.title}
                </Title>
                {onEdit && (
                    <Tooltip label="Edit resource">
                        <ActionIcon variant="subtle" color="info" onClick={handleClick} aria-label="Edit resource">
                            <FontAwesomeIcon icon="edit" />
                        </ActionIcon>
                    </Tooltip>
                )}
            </Group>
            <Text size="sm" c="dimmed" mb="xs">
                {resource.description}
            </Text>
            {resource.author && (
                <Text size="xs" c="dimmed" fs="italic" mt="auto">
                    by <UserLink user={resource.author} />
                </Text>
            )}
        </Card>
    );
}
