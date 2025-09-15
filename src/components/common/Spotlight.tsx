import { Stack, Text, Skeleton, Alert, Code, List, FocusTrap } from "@mantine/core";
import { Spotlight as MantineSpotlight } from "@mantine/spotlight";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ISearchItem, useGlobalSearch } from "../../hooks/useGlobalSearch";
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

    const navigate = useNavigate();

    const ALL_TYPES: Record<string, boolean> = {
        tournament: true,
        voting: true,
        ticket: true,
        report: user?.isCommitteeOrAdmin ?? false,
        resource: true,
        doc: user?.isCommitteeOrAdmin ?? false,
    };

    const AVAILABLE_TYPES = Object.entries(ALL_TYPES).filter(([, enabled]) => enabled).map(([type]) => type);

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
                            <Alert ta="left" color="primary" title="Info" icon={<FontAwesomeIcon icon="info-circle" />}>
                                You can navigate to anything from here, i.e. website pages, tournaments, resources, etc.
                                <br />
                                <br />
                                For better results, try searching with the format <Code>type:query</Code>, for example:
                                <List>
                                    <List.Item>
                                        <Code>tournament:suiji</Code>
                                    </List.Item>
                                    <List.Item>
                                        <Code>ticket:bracket</Code>
                                    </List.Item>
                                    <List.Item>
                                        <Code>resource:official support</Code>
                                    </List.Item>
                                </List>
                                <br />
                                Available types are:
                                <br />
                                {AVAILABLE_TYPES
                                    .map((type, index) => (
                                        <Text span key={type}>
                                            <Code>{type}</Code>
                                            {index < AVAILABLE_TYPES.length - 1 && ", "}
                                        </Text>
                                    ))}
                            </Alert>
                        )}
                    </MantineSpotlight.Empty>
                )}
            </MantineSpotlight.ActionsList>
        </MantineSpotlight.Root>
    );
}
