import { useQuery } from "@tanstack/react-query";
import utils from "../../utils";
import { routes, IRoute } from "../base/header.config";
import { ITournament } from "../../interfaces/Tournament";
import { IVoting } from "../../interfaces/Voting";
import { ITicket } from "../../interfaces/Ticket";
import { IArticle } from "../../interfaces/Article";
import { IResource } from "../../interfaces/Resource";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";

export interface ISearchItem {
    object: Partial<ITournament | IVoting | ITicket | IArticle | IResource | IRoute>;
    type: string;
    link: string;
}

interface IGlobalSearchResponse {
    tournaments: ITournament[];
    votings: IVoting[];
    tickets: ITicket[];
    reports: ITicket[];
    resources: IResource[];
    articles: IArticle[];
}

export function useGlobalSearch(query: string) {
    const [user] = useAtom(loggedInUserAtom);

    // Get available routes filtered by permissions
    const availableRoutes = routes.filter((route) => utils.hasRequiredPermissions(user, route.permissions));

    // Search routes by title
    const searchRoutes = (searchQuery: string): ISearchItem[] => {
        if (!searchQuery.trim()) return [];

        const searchTerm = searchQuery.toLowerCase();
        const routeResults: ISearchItem[] = [];

        // Search main routes (only if they don't have children - filter out parent routes)
        availableRoutes.forEach((route) => {
            // Skip parent routes (routes that have children/links)
            if (route.links && route.links.length > 0) {
                // This is a parent route, only search its children
                route.links.forEach((subRoute) => {
                    if (subRoute.title.toLowerCase().includes(searchTerm)) {
                        routeResults.push({
                            object: subRoute,
                            type: "route",
                            link: subRoute.link || "#",
                        });
                    }
                });
            } else {
                // This is a leaf route (no children), search it directly
                if (route.title.toLowerCase().includes(searchTerm)) {
                    routeResults.push({
                        object: route,
                        type: "route",
                        link: route.link || "#",
                    });
                }
            }
        });

        return routeResults.slice(0, 5); // Limit to 5 results
    };

    // API search query
    const {
        data: apiResults,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["globalSearch", query],
        queryFn: () =>
            utils.apiCall<IGlobalSearchResponse>({
                method: "get",
                url: "/api/search",
                params: { query },
            }),
        enabled: !!query && query.trim().length > 0,
    });

    // Combine route and API search results
    const searchResults: ISearchItem[] = [];

    // Only add results when not loading (wait for API to complete)
    if (!isLoading) {
        // Add route results first
        if (query) {
            searchResults.push(...searchRoutes(query));
        }

        // Add API results
        if (apiResults) {
            // Add tournaments
            apiResults.tournaments.forEach((tournament) => {
                searchResults.push({
                    object: tournament,
                    type: "tournament",
                    link: `/tournaments/${tournament._id}`,
                });
            });

            // Add votings
            apiResults.votings.forEach((voting) => {
                searchResults.push({
                    object: voting,
                    type: "voting",
                    link: `/votes/${voting._id}`,
                });
            });

            // Add tickets
            apiResults.tickets.forEach((ticket) => {
                searchResults.push({
                    object: ticket,
                    type: "ticket",
                    link: `/tickets/${ticket._id}`,
                });
            });

            // Add reports
            apiResults.reports.forEach((report) => {
                searchResults.push({
                    object: report,
                    type: "report",
                    link: `/reports/${report._id}`,
                });
            });

            // Add resources
            apiResults.resources.forEach((resource) => {
                searchResults.push({
                    object: resource,
                    type: "resource",
                    link: resource.link || "#",
                });
            });

            // Add articles
            apiResults.articles.forEach((article) => {
                searchResults.push({
                    object: article,
                    type: "article",
                    link: `/docs/${article._id}`,
                });
            });
        }
    }

    return {
        results: searchResults,
        isLoading,
        error,
    };
}
