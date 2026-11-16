import { PageSection, PageSections } from "../components/common/PageSection";
import HomeNewsSection from "../components/home/HomeNewsSection";
import HomeFeaturesSection from "../components/home/HomeFeaturesSection";
import HomeCommitteeSection from "../components/home/HomeCommitteeSection";

export default function HomePage() {
    return (
        <PageSections>
            <PageSection>
                <HomeNewsSection />
            </PageSection>
            <PageSection>
                <HomeFeaturesSection />
            </PageSection>
            <PageSection>
                <HomeCommitteeSection />
            </PageSection>
        </PageSections>
    );
}
