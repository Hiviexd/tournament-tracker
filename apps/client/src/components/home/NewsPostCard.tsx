import { Badge, Box, Card, Group, Stack, Text, Title } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IArticle } from "@tc/types/Article";
import DateBadge from "../common/badges/DateBadge";
import TournamentTypeBadge from "../common/badges/TournamentTypeBadge";
import { getNewsPreview } from "./newsPreview";

interface IProps {
    article: IArticle;
    featured?: boolean;
    onSelect: (article: IArticle) => void;
}

function NewsBadges({ article, featured }: { article: IArticle; featured: boolean }) {
    return (
        <Group gap={6}>
            {featured && (
                <Badge size="sm" variant="filled">
                    Latest
                </Badge>
            )}
            {article.categories?.map((category) => (
                <TournamentTypeBadge key={category} type={category} size="sm" withText={featured} />
            ))}
            <DateBadge date={article.createdAt} size="sm" staticColor />
        </Group>
    );
}

export default function NewsPostCard({ article, featured = false, onSelect }: IProps) {
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(article);
        }
    };

    if (featured) {
        return (
            <Card
                radius="md"
                padding="lg"
                className="news-feature"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(article)}
                onKeyDown={handleKeyDown}>
                <Box className="news-feature-banner" aria-hidden />
                <Stack gap="sm" className="news-feature-body">
                    <NewsBadges article={article} featured />
                    <Title order={2} className="news-feature-title" lineClamp={3}>
                        {article.title}
                    </Title>
                    <Text c="dimmed" lineClamp={2} className="news-feature-preview">
                        {getNewsPreview(article.content, 260)}
                    </Text>
                    <Group gap={8} className="news-feature-cta">
                        <Text size="sm" fw={600}>
                            Read post
                        </Text>
                        <FontAwesomeIcon icon="chevron-right" className="news-chevron" aria-hidden />
                    </Group>
                </Stack>
            </Card>
        );
    }

    return (
        <Card
            radius="md"
            padding="md"
            className="news-post-card"
            role="button"
            tabIndex={0}
            onClick={() => onSelect(article)}
            onKeyDown={handleKeyDown}>
            <Group gap="sm" wrap="nowrap" align="center">
                <Stack gap={8} style={{ flex: 1, minWidth: 0 }}>
                    <Title order={5} lineClamp={2}>
                        {article.title}
                    </Title>
                    <NewsBadges article={article} featured={false} />
                </Stack>
                <FontAwesomeIcon icon="chevron-right" className="news-chevron" aria-hidden />
            </Group>
        </Card>
    );
}
