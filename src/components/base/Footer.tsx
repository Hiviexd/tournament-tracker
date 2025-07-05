import { Group, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface FooterItem {
    icon: IconProp;
    label: string;
    href: string;
}

export default function Footer() {
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
                    leftSection={<FontAwesomeIcon icon={item.icon} />}>
                    {item.label}
                </Button>
            ))}
        </Group>
    );
}
