import { Card, Stack, Title, Text, Group, Tooltip } from "@mantine/core";
import DateBadge from "../common/badges/DateBadge";
import { IArticle } from "@tc/types/Article";
import dayjs from "@tc/utils/dayjs";
import { getNewsPreview } from "./newsPreview";
import NewsCategoryIcons from "../news/NewsCategoryIcons";

interface IProps {
    article: IArticle;
    featured?: boolean;
    onSelect: (article: IArticle) => void;
}

export default function NewsPostCard({ article, featured = false, onSelect }: IProps) {
    return (
        <Card
            padding={featured ? "lg" : "md"}
            radius="md"
            bg="primary.10"
            className={featured ? "news-post-card news-post-card--featured" : "news-post-card"}
            onClick={() => onSelect(article)}>
            <Stack gap={featured ? "sm" : "xs"} className="news-post-card-body">
                <Title order={featured ? 2 : 4} className="news-post-card-title" lineClamp={2}>
                    <NewsCategoryIcons categories={article.categories} />
                    {article.title}
                </Title>
                <Text size={featured ? "md" : "sm"} c="dimmed" lineClamp={1} className="news-post-card-preview">
                    {getNewsPreview(article.content)}
                </Text>
                <Group>
                    <Tooltip label={dayjs(article.createdAt).format("LLL")}>
                        <DateBadge date={article.createdAt} size="xs" staticColor />
                    </Tooltip>
                </Group>
            </Stack>
        </Card>
    );
}
