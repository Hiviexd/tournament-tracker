import { Stack, Text, Skeleton } from "@mantine/core";
import { Spotlight as MantineSpotlight } from "@mantine/spotlight";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import SpotlightAction from "./spotlight/SpotlightAction";

export default function Spotlight() {
    const [search, setSearch] = useState("");
    const [debouncedSearch] = useDebouncedValue(search, 400);
    const { results, isLoading, error } = useGlobalSearch(debouncedSearch);

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

    const SpotlightSkeleton = () => {
        return (
            <MantineSpotlight.ActionsList>
                <Skeleton height={40} width="100%" />
            </MantineSpotlight.ActionsList>
        );
    };

    return (
        <MantineSpotlight.Root scrollable>
            <MantineSpotlight.Search
                placeholder="Search for anything..."
                leftSection={<FontAwesomeIcon icon="search" />}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
            />
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
                                    <SpotlightAction key={result.link} searchItem={result} />
                                ))}
                            </MantineSpotlight.ActionsGroup>
                        ))}
                    </>
                )}
                {!isLoading && results.length === 0 && (
                    <MantineSpotlight.Empty>
                        <Stack>
                            <Text>No results found :(</Text>
                            {error && <Text>{error.message}</Text>}
                        </Stack>
                    </MantineSpotlight.Empty>
                )}
            </MantineSpotlight.ActionsList>
        </MantineSpotlight.Root>
    );
}
