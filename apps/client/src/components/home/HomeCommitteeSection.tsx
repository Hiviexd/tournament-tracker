import { Stack, Title, Text, Box } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CommitteeSection from "../users/CommitteeSection";
import { IUser } from "@tc/types/User";
import { useRandomQuote } from "../../hooks/useQuotes";
import dayjs from "@tc/utils/dayjs";

export default function HomeCommitteeSection() {
    const { data: quote, isLoading: isQuoteLoading } = useRandomQuote();

    const handleUserSelect = (user: IUser) => {
        window.open(user.osuProfileUrl, "_blank");
    };

    return (
        <Stack gap="lg" className="home-committee">
            <Stack gap="xs" ta="center" align="center">
                <Title order={2} className="home-section-title">
                    Meet the Committee
                </Title>
                {!isQuoteLoading && quote ? (
                    <Stack gap="xs" className="home-quote" maw={520} mx="auto" align="stretch">
                        <Box className="home-quote-body">
                            <FontAwesomeIcon icon="quote-left" className="home-quote-mark" aria-hidden />
                            <Text size="sm" c="dimmed" fs="italic" className="home-quote-text">
                                {quote.quote}
                            </Text>
                            <FontAwesomeIcon
                                icon="quote-right"
                                className="home-quote-mark home-quote-mark--close"
                                aria-hidden
                            />
                        </Box>
                        <Text size="xs" className="home-quote-attribution">
                            {quote.author?.username}, {dayjs(quote.createdAt).format("YYYY")}
                        </Text>
                    </Stack>
                ) : null}
            </Stack>
            <CommitteeSection onSelect={handleUserSelect} />
        </Stack>
    );
}
