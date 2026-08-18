import { Group, Button, Popover, useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import CommitHeatmap from "./CommitHeatmap";

interface FooterItem {
    icon: IconProp;
    label: string;
    href: string;
}

export default function Footer() {
    const theme = useMantineTheme();
    const isLargeScreen = useMediaQuery(`(min-width: ${theme.breakpoints.sm})`);

    const footerItems: FooterItem[] = [
        {
            icon: ["fab", "github"],
            label: "Source Code",
            href: "https://github.com/Hiviexd/tournament-tracker",
        },
        {
            icon: "bug",
            label: "Report Issues",
            href: "https://github.com/Hiviexd/tournament-tracker/issues/new",
        },
        {
            icon: "users",
            label: "The Team",
            href: "https://osu.ppy.sh/wiki/en/People/Tournament_Committee",
        },
        {
            icon: "heart-pulse",
            label: "Status",
            href: "https://status.hivie.tn/status",
        },
    ];

    return (
        <Group gap="xs" align="center" justify="center" mt="lg">
            {footerItems.map((item) => (
                <Button
                    key={item.label}
                    variant="subtle"
                    size="sm"
                    component="a"
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    leftSection={<FontAwesomeIcon icon={item.icon} />}>
                    {item.label}
                </Button>
            ))}

            {isLargeScreen && (
                <Popover position="top" withArrow shadow="md">
                    <Popover.Target>
                        <Button variant="subtle" size="sm" leftSection={<FontAwesomeIcon icon="code" />}>
                            Activity
                        </Button>
                    </Popover.Target>
                    <Popover.Dropdown w="fit-content">
                        <CommitHeatmap />
                    </Popover.Dropdown>
                </Popover>
            )}
        </Group>
    );
}
