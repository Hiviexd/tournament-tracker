import { Spotlight } from "@mantine/spotlight";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { ISearchItem } from "../../../hooks/useGlobalSearch";
import { Group, Badge, Text, Stack, Card } from "@mantine/core";
import { ITicket } from "../../../../interfaces/Ticket";

// badges
import TournamentTypeBadge from "../badges/TournamentTypeBadge";
import TournamentStatusBadge from "../badges/TournamentStatusBadge";
import VotingTypeBadge from "../badges/VotingTypeBadge";
import ReportTypeBadge from "../badges/ReportTypeBadge";
import DueDateBadge from "../badges/DueDateBadge";
import UserGroupBadge from "../badges/UserGroupBadge";

interface SpotlightActionProps {
    searchItem: ISearchItem;
    onClick?: () => void;
}

export default function SpotlightAction({ searchItem, onClick }: SpotlightActionProps) {
    const getIconForType = (searchItem: ISearchItem) => {
        switch (searchItem.type) {
            case "route":
                return "icon" in searchItem.object && searchItem.object.icon ? searchItem.object.icon : "file-alt";
            case "tournament":
                return "trophy";
            case "voting":
            case "vote":
                return "vote-yea";
            case "ticket":
                return "paper-plane";
            case "report":
                return "flag";
            case "resource":
                return "file-alt";
            case "article":
                return "newspaper";
            default:
                return "search";
        }
    };

    const getTitle = () => {
        const obj = searchItem.object;

        // Handle different object types
        if ("title" in obj && obj.title) {
            return obj.title;
        }

        // Fallback for objects without title
        if ("name" in obj && obj.name) {
            return obj.name;
        }

        return "Unknown Item";
    };

    const getBadges = () => {
        const obj = searchItem.object;
        const badges: React.ReactElement[] = [];

        switch (searchItem.type) {
            case "tournament":
                if ("type" in obj && obj.type) {
                    badges.push(<TournamentTypeBadge key="type" type={obj.type} size="xs" />);
                }
                if ("status" in obj && obj.status) {
                    badges.push(<TournamentStatusBadge key="status" status={obj.status} size="xs" />);
                }
                if ("isActive" in obj && obj.isActive !== undefined) {
                    badges.push(
                        <Badge key="active" size="xs" variant="light" color={obj.isActive ? "green" : "gray"}>
                            {obj.isActive ? "Active" : "Archived"}
                        </Badge>
                    );
                }
                break;

            case "voting":
                if ("category" in obj && obj.category) {
                    badges.push(<VotingTypeBadge key="type" type={obj.category} size="xs" />);
                }

                if ("assignedGroups" in obj && obj.assignedGroups && Array.isArray(obj.assignedGroups)) {
                    badges.push(
                        ...obj.assignedGroups.map((group) => (
                            <UserGroupBadge key={group} group={group} size="xs" variant="light" />
                        ))
                    );
                }
                if ("isActive" in obj && obj.isActive !== undefined) {
                    badges.push(
                        <Badge key="active" size="xs" variant="light" color={obj.isActive ? "green" : "gray"}>
                            {obj.isActive ? "Active" : "Concluded"}
                        </Badge>
                    );
                }
                if ("deadline" in obj && obj.deadline && obj.isActive) {
                    badges.push(<DueDateBadge key="deadline" date={obj.deadline} size="xs" variant="light" />);
                }
                break;

            case "ticket":
            case "report":
                badges.push(<ReportTypeBadge key="type" report={obj as ITicket} size="xs" />);

                if ("assignedGroup" in obj && obj.assignedGroup) {
                    badges.push(<UserGroupBadge key="group" group={obj.assignedGroup} size="xs" variant="light" />);
                }
                if ("isActive" in obj && obj.isActive !== undefined) {
                    badges.push(
                        <Badge key="active" size="xs" variant="light" color={obj.isActive ? "green" : "gray"}>
                            {obj.isActive ? "Active" : "Closed"}
                        </Badge>
                    );
                }
                break;

            case "resource":
                if ("category" in obj && obj.category) {
                    badges.push(
                        <Badge key="category" size="xs" variant="light">
                            {obj.category}
                        </Badge>
                    );
                }
                break;

            case "route":
                // Routes don't have additional badges
                break;

            case "article":
                // Articles only have title, no additional badges
                break;
        }

        return badges;
    };

    return (
        <Spotlight.Action onClick={onClick}>
            <Card className="spotlight-action-card" bg="primary.10" p="xs" radius="md" shadow="sm" w="100%">
                <Group gap="xs" style={{ width: "100%" }}>
                    <FontAwesomeIcon
                        icon={getIconForType(searchItem) as IconProp}
                        size={getBadges().length > 0 ? "lg" : undefined}
                    />
                    <Stack gap={4} style={{ flex: 1 }}>
                        <Text size="sm">{getTitle()}</Text>
                        {getBadges().length > 0 && <Group gap="xs">{getBadges()}</Group>}
                    </Stack>
                </Group>
            </Card>
        </Spotlight.Action>
    );
}
