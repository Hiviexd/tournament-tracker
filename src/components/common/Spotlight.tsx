import { Stack, Text, Skeleton, Alert, Code, List, FocusTrap } from "@mantine/core";
import { Spotlight as MantineSpotlight } from "@mantine/spotlight";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ISearchItem, useGlobalSearch } from "../../hooks/useGlobalSearch";
import SpotlightAction from "./spotlight/SpotlightAction";
import { useNavigate } from "react-router-dom";
import utils from "../../../utils";

export default function Spotlight() {
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const { results, isLoading, error } = useGlobalSearch(debouncedSearch);

    const navigate = useNavigate();

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
                return "Articles";
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };

    const handleSelectOption = (result: ISearchItem) => {
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
        <MantineSpotlight.Root scrollable>
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
                {!isLoading && results.length === 0 && (
                    <MantineSpotlight.Empty>
                        {debouncedSearch.length > 0 ? (
                            <Stack gap="xs">
                                <Text>No results found :(</Text>
                                {error && <Text>{error.message}</Text>}
                            </Stack>
                        ) : (
                            <Alert ta="left" color="primary" title="Tip" icon={<FontAwesomeIcon icon="info-circle" />}>
                                Try searching with the format <Code>type:query</Code>, for example:
                                <List>
                                    <List.Item>
                                        <Code>tournament:world cup</Code>
                                    </List.Item>
                                    <List.Item>
                                        <Code>vote:tribadge</Code>
                                    </List.Item>
                                    <List.Item>
                                        <Code>ticket:tournament bans</Code>
                                    </List.Item>
                                </List>
                            </Alert>
                        )}
                    </MantineSpotlight.Empty>
                )}
            </MantineSpotlight.ActionsList>
        </MantineSpotlight.Root>
    );
}
