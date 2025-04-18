import { Card, SimpleGrid, Stack, Text, Title, Container, Skeleton } from "@mantine/core";
import { Link } from "react-router-dom";
import { useDocumentation } from "../hooks/useArticle";
import EmptyState from "../components/common/EmptyState";

export default function DocumentationListPage() {
    const { data: articles, isLoading, isError } = useDocumentation();

    const LoadingState = () => (
        <Container size="lg">
            <Stack gap="xl">
                {/* Welcome Card Skeleton */}
                <Skeleton height={100} width="100%" radius="md" />

                {/* Documentation Cards Grid Skeleton */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {Array(8)
                        .fill(0)
                        .map((_, index) => (
                            <Card key={index} shadow="sm" p="xl" radius="md" className="feature-card">
                                <Skeleton height={26} width="80%" mx="auto" />
                            </Card>
                        ))}
                </SimpleGrid>
            </Stack>
        </Container>
    );

    if (isLoading) {
        return <LoadingState />;
    }

    if (isError || !articles || articles.length === 0) {
        return (
            <Container size="lg">
                <EmptyState
                    icon="book"
                    title={isError ? "Error loading documentation" : "No documentation found"}
                    description={
                        isError ? "Try refreshing the page" : "Documentation articles will appear here once created"
                    }
                />
            </Container>
        );
    }

    // Find the welcome article
    const welcomeArticle = articles.find((article) => article.slug === "welcome");

    // Get the rest of the articles and sort them alphabetically
    const otherArticles = articles
        .filter((article) => article.slug !== "welcome")
        .sort((a, b) => a.title.localeCompare(b.title));

    return (
        <Container size="lg">
            <Stack gap="xl">
                {/* Welcome Card - Full Width */}
                {welcomeArticle && (
                    <Card
                        shadow="sm"
                        p="lg"
                        radius="md"
                        className="feature-card"
                        component={Link}
                        to={`/docs/${welcomeArticle.slug}`}>
                        <Title order={2} ta="center">
                            Welcome to the Tournament Committee!
                        </Title>
                        <Text c="dimmed" ta="center" size="sm">
                            the gulag awaits...
                        </Text>
                    </Card>
                )}

                {/* Documentation Cards Grid */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {otherArticles.map((article) => (
                        <Card
                            key={article._id}
                            shadow="sm"
                            p="xl"
                            radius="md"
                            className="feature-card"
                            component={Link}
                            to={`/docs/${article.slug}`}>
                            <Title order={3} size="h4" ta="center">
                                {article.title}
                            </Title>
                        </Card>
                    ))}
                </SimpleGrid>
            </Stack>
        </Container>
    );
}
