import { Card, Stack, Title, Text, Group, Badge, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Link } from "react-router-dom";

export interface HomeFeature {
    icon: IconProp;
    title: string;
    description: string;
    link: string;
    disabled?: boolean;
    new?: boolean;
}

interface IProps {
    feature: HomeFeature;
}

export default function HomeFeatureCard({ feature }: IProps) {
    const content = (
        <Stack gap={6} className="feature-card-body">
            <Group gap="sm" wrap="nowrap" align="center">
                <Box className="feature-card-icon" aria-hidden>
                    <FontAwesomeIcon icon={feature.icon} />
                </Box>
                <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Title order={4} lineClamp={2} style={{ flex: 1 }}>
                        {feature.title}
                    </Title>
                    {feature.disabled && (
                        <Badge size="sm" variant="light">
                            Coming Soon
                        </Badge>
                    )}
                    {feature.new && (
                        <Badge size="sm" variant="light" className="animation-pulse">
                            New!
                        </Badge>
                    )}
                </Group>
                {!feature.disabled && (
                    <FontAwesomeIcon icon="chevron-right" className="feature-card-chevron" aria-hidden />
                )}
            </Group>
            <Text size="sm" c="dimmed" lineClamp={3}>
                {feature.description}
            </Text>
        </Stack>
    );

    const cardProps = {
        padding: "md" as const,
        radius: "md" as const,
        className: "feature-card",
        "data-disabled": feature.disabled,
    };

    if (feature.disabled) {
        return <Card {...cardProps}>{content}</Card>;
    }

    return (
        <Card {...cardProps} component={Link} to={feature.link}>
            {content}
        </Card>
    );
}
