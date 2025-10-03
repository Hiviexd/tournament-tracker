import { Stack, Text, Skeleton, Alert, Code, List, FocusTrap, Kbd, Group, Button } from "@mantine/core";
import { Spotlight as MantineSpotlight } from "@mantine/spotlight";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ISearchItem, useGlobalSearch, useSearchHistory } from "../../hooks/useGlobalSearch";
import SpotlightAction from "./spotlight/SpotlightAction";
import { useNavigate } from "react-router-dom";
import utils from "../../../utils";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";

export default function Spotlight() {
    const [user] = useAtom(loggedInUserAtom);

    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const { results, isLoading, error } = useGlobalSearch(debouncedSearch);
    const { lastSearches, addSearchItem, clearLastSearches } = useSearchHistory();

    const navigate = useNavigate();

    const SEARCH_TYPES = utils.getSearchTypes({ user, searchType: "all" });

    const formatType = (type: string) => {
        if (type === "voting") return "Votes";
        if (type === "article") return "Documentation";
        return type.charAt(0).toUpperCase() + type.slice(1) + "s";
    };

    const getGroupLabel = (type: string) => {
        switch (type) {
            case "route":
                return "Pages";
            case "tournament":
                return "Tournaments";
            case "voting":
                return "Votes";
            case "ticket":
                return "Tickets";
            case "report":
                return "Reports";
            case "resource":
                return "Resources";
            case "article":
                return "Documentation";
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    const handleSelectOption = (result: ISearchItem) => {
        addSearchItem(result);
        setSearch("");

        if (utils.isExternalLink(result.link)) {
            window.open(result.link, "_blank");
        } else {
            navigate(result.link);
        }
    };

    const SpotlightSkeleton = () => {
        return (
            <>
                <MantineSpotlight.ActionsGroup label="Loading...">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <MantineSpotlight.Action key={index} disabled>
                            <Skeleton height={60} width="100%" radius="md" />
                        </MantineSpotlight.Action>
                    ))}
                </MantineSpotlight.ActionsGroup>
            </>
        );
    };

    return (
        <MantineSpotlight.Root scrollable maxHeight="500px">
            <FocusTrap active>
                <MantineSpotlight.Search
                    placeholder="Search for anything..."
                    leftSection={<FontAwesomeIcon icon="search" />}
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                />
            </FocusTrap>
            <MantineSpotlight.ActionsList>
                {isLoading && <SpotlightSkeleton />}
                {results.length > 0 && (
                    <>
                        {Object.entries(
                            results.reduce((groups, result) => {
                                const type = result.type;
                                if (!groups[type]) {
                                    groups[type] = [];
                                }
                                groups[type].push(result);
                                return groups;
                            }, {} as Record<string, typeof results>)
                        ).map(([type, typeResults]) => (
                            <MantineSpotlight.ActionsGroup key={type} label={getGroupLabel(type)}>
                                {typeResults.map((result) => (
                                    <SpotlightAction
                                        key={result.link}
                                        searchItem={result}
                                        onClick={() => handleSelectOption(result)}
                                    />
                                ))}
                            </MantineSpotlight.ActionsGroup>
                        ))}
                    </>
                )}
                {!isLoading && results.length === 0 && lastSearches.length > 0 && debouncedSearch.length === 0 && (
                    <MantineSpotlight.ActionsGroup label="Recent Searches">
                        {lastSearches.map((searchItem, index) => (
                            <SpotlightAction
                                key={`${searchItem.type}-${searchItem.link}-${index}`}
                                searchItem={searchItem}
                                onClick={() => handleSelectOption(searchItem)}
                            />
                        ))}
                        <Group justify="center" mx="sm" mt="xs">
                            <Button
                                size="xs"
                                color="danger"
                                variant="light"
                                leftSection={<FontAwesomeIcon icon="trash" />}
                                onClick={clearLastSearches}>
                                Clear
                            </Button>
                        </Group>
                    </MantineSpotlight.ActionsGroup>
                )}
                {!isLoading && results.length === 0 && (
                    <MantineSpotlight.Empty>
                        {debouncedSearch.length > 0 ? (
                            <Stack gap="xs">
                                <Text>No results found :(</Text>
                                {error && <Text>{error.message}</Text>}
                            </Stack>
                        ) : (
                            <Stack gap="lg" align="center">
                                <Group gap="lg">
                                    <Text size="sm">
                                        <Kbd size="xs">
                                            <FontAwesomeIcon icon="arrow-up" />
                                        </Kbd>{" "}
                                        <Kbd size="xs">
                                            <FontAwesomeIcon icon="arrow-down" />
                                        </Kbd>{" "}
                                        to navigate
                                    </Text>
                                    <Text size="sm">
                                        <Kbd size="xs">
                                            <FontAwesomeIcon icon="arrow-turn-down" rotation={90} />
                                        </Kbd>{" "}
                                        to select
                                    </Text>
                                    <Text size="sm">
                                        <Kbd size="xs">Esc</Kbd> to close
                                    </Text>
                                </Group>
                                <Alert
                                    ta="left"
                                    color="primary"
                                    title="Info"
                                    icon={<FontAwesomeIcon icon="info-circle" />}>
                                    <Text size="sm" mb="xs">
                                        You can navigate to anything from here, i.e. website pages, tournaments,
                                        resources, etc.
                                    </Text>

                                    <Text size="sm" mb="xs">
                                        For better results, try searching with the format <Code>type:query</Code>, for
                                        example: <Code>tournament:suiji</Code> or <Code>rs:official support</Code>
                                    </Text>
                                    <Text size="sm">Available types are:</Text>
                                    <List>
                                        {Object.entries(SEARCH_TYPES).map(([type, aliases]) => (
                                            <List.Item key={type}>
                                                <Text span size="sm">
                                                    {formatType(type)}:{" "}
                                                </Text>
                                                {aliases.map((alias, index) => (
                                                    <Text span key={alias}>
                                                        <Code>{alias}</Code>
                                                        {index < aliases.length - 1 && ", "}
                                                    </Text>
                                                ))}
                                            </List.Item>
                                        ))}
                                    </List>
                                </Alert>
                            </Stack>
                        )}
                    </MantineSpotlight.Empty>
                )}
            </MantineSpotlight.ActionsList>
        </MantineSpotlight.Root>
    );
}
