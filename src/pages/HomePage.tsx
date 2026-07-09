import { Stack, Divider } from "@mantine/core";
import HomeFeaturesSection from "../components/home/HomeFeaturesSection";
import HomeCommitteeSection from "../components/home/HomeCommitteeSection";

export default function HomePage() {
    return (
        <Stack gap="xl" className="home-page">
            <HomeFeaturesSection />
            <Divider className="home-divider" />
            <HomeCommitteeSection />
        </Stack>
    );
}
