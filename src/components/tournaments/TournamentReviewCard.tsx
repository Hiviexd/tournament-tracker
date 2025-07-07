import { Card, Stack, Badge, Text, Box } from "@mantine/core";
import { IReview } from "../../../interfaces/Review";
import UserDisplay from "../common/UserDisplay";
import MarkdownText from "../common/MarkdownText";
import _ from "lodash";
import { ITournament } from "../../../interfaces/Tournament";
import utils from "../../../utils";
import { useAtom } from "jotai";
import { loggedInUserAtom } from "../../store/atoms";
import { UserGroup } from "../../../interfaces/User";
import AlertText from "../common/AlertText";

interface IProps {
    tournament: ITournament;
    review: IReview;
}

export default function TournamentReviewCard({ tournament, review }: IProps) {
    const [user] = useAtom(loggedInUserAtom);

    const getVoteColor = () => {
        switch (review.vote) {
            case "approve":
                return "success";
            case "deny":
                return "danger";
            case "changesRequested":
                return "orange";
            default:
                return "primary";
        }
    };

    const getUncheckedItems = () => {
        return review.checklist.filter((item) => !item.checked).map((item) => item.item);
    };

    const getCheckedItemsCount = () => {
        return review.checklist.filter((item) => item.checked).length;
    };

    const shouldHideChecklist = () => {
        return review.vote === "deny" && getCheckedItemsCount() === 0;
    };

    const getUserDisplayProps = () => {
        if (!user?.isCommittee) {
            return {
                username: "Reviewer",
                avatarUrl: "/assets/logo-512.png",
                group: (tournament.isTournament ? "tc" : "cc") as UserGroup,
            };
        }
        return {
            user: review.author,
        };
    };

    const uncheckedItems = getUncheckedItems();

    return (
        <Card
            bg="primary.10"
            shadow="xs"
            p="md"
            radius="md"
            style={{
                borderLeft: `4px solid var(--mantine-color-${getVoteColor()}-6)`,
            }}>
            <Box>
                {/* Mobile layout */}
                <Box display={{ base: "block", sm: "none" }}>
                    <Stack gap="md">
                        <UserDisplay {...getUserDisplayProps()} />
                        <Badge size="lg" variant="light" color={getVoteColor()}>
                            {_.startCase(review.vote)}
                        </Badge>
                        <Stack gap="xs">
                            {!shouldHideChecklist() && (
                                <>
                                    <AlertText
                                        text={
                                            uncheckedItems.length === 0
                                                ? "No issues with checklist!"
                                                : `Found ${utils.formatCount(
                                                      uncheckedItems.length,
                                                      "issue"
                                                  )} with checklist:`
                                        }
                                        type={uncheckedItems.length === 0 ? "success" : "danger"}
                                        icon={uncheckedItems.length === 0 ? "circle-check" : "exclamation-triangle"}
                                        size="sm"
                                    />
                                    {uncheckedItems.length > 0 && (
                                        <Box ml="md">
                                            {uncheckedItems.map((item, index) => (
                                                <AlertText key={index} text={item} type="danger" size="sm" />
                                            ))}
                                        </Box>
                                    )}
                                </>
                            )}
                        </Stack>
                        {review.comment && (
                            <Box>
                                <MarkdownText content={review.comment} />
                            </Box>
                        )}
                    </Stack>
                </Box>

                {/* Desktop layout */}
                <Box display={{ base: "none", sm: "block" }}>
                    <Box style={{ float: "right", marginLeft: "var(--mantine-spacing-md)" }}>
                        <Badge size="lg" variant="light" color={getVoteColor()}>
                            {_.startCase(review.vote)}
                        </Badge>
                    </Box>
                    <Box>
                        <UserDisplay {...getUserDisplayProps()} />
                        <Stack gap="xs" mt="xs">
                            {!shouldHideChecklist() && (
                                <>
                                    <AlertText
                                        text={
                                            uncheckedItems.length === 0
                                                ? "No issues with checklist!"
                                                : `Found ${utils.formatCount(
                                                      uncheckedItems.length,
                                                      "issue"
                                                  )} with checklist:`
                                        }
                                        type={uncheckedItems.length === 0 ? "success" : "danger"}
                                        icon={uncheckedItems.length === 0 ? "circle-check" : "exclamation-triangle"}
                                        size="sm"
                                    />
                                    {uncheckedItems.length > 0 && (
                                        <Box ml="md">
                                            {uncheckedItems.map((item, index) => (
                                                <AlertText key={index} text={item} type="danger" size="sm" />
                                            ))}
                                        </Box>
                                    )}
                                </>
                            )}
                            {review.comment && (
                                <Box mt="xs">
                                    <Text fw={500} size="sm" c="dimmed">
                                        Review Comment
                                    </Text>
                                    <MarkdownText content={review.comment} />
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </Card>
    );
}
