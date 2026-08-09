import { Card, Stack, Title, Text, Group, Box, Image } from "@mantine/core";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import LoginButton from "../common/buttons/LoginButton";

export default function HomeHero() {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <Card padding={0} radius="md" className="home-hero" shadow="sm">
            <Box className="home-hero-glow" aria-hidden />
            <Stack align="center" gap="lg" className="home-hero-content" ta="center">
                <Image src="/assets/logo-main.svg?20260211" alt="" w={72} h={72} className="home-hero-logo" />
                <Stack gap="xs" maw={640}>
                    <Title order={1} className="home-hero-title">
                        Tournament Tracker
                    </Title>
                    <Text size="lg" c="dimmed" className="home-hero-tagline">
                        The one-stop shop for all official osu! tournament correspondence and information!
                    </Text>
                </Stack>
                {!user && (
                    <Group justify="center" className="home-hero-cta">
                        <LoginButton size="lg" text="Sign in with osu!" />
                    </Group>
                )}
            </Stack>
        </Card>
    );
}
