import { useEffect, useMemo, Fragment, type ReactNode } from "react";
import { Stack, Group, Text, Box, Anchor, SimpleGrid, Image, Pill, List } from "@mantine/core";
import { UseFormReturnType } from "@mantine/form";
import dayjs from "../../../../utils/dayjs";
import utils from "../../../../utils";
import { IUser } from "../../../../interfaces/User";
import { ExtraLinkTypeIcon } from "../info/ExtraLinksEditor";
import UserLink from "../../common/UserLink";
import GameModeIcon from "../../common/GameModeIcon";
import TournamentTypeBadge from "../../common/badges/TournamentTypeBadge";
import { TournamentCreateFormValues } from "./tournamentCreateForm";

function OverviewField({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Box>
            <Text size="xs" c="dimmed" fw={500} mb={4}>
                {label}
            </Text>
            {children}
        </Box>
    );
}

function OverviewEmpty() {
    return (
        <Text size="sm" c="dimmed">
            —
        </Text>
    );
}

interface IProps {
    form: UseFormReturnType<TournamentCreateFormValues>;
    selectedHosts: IUser[];
    selectedWinners: IUser[];
    files: File[];
}

export default function TournamentCreateOverviewStep({ form, selectedHosts, selectedWinners, files }: IProps) {
    const badgePreviewUrls = useMemo(
        () => files.map((file) => ({ name: file.name, url: URL.createObjectURL(file) })),
        [files],
    );

    useEffect(() => {
        return () => {
            badgePreviewUrls.forEach(({ url }) => URL.revokeObjectURL(url));
        };
    }, [badgePreviewUrls]);

    return (
        <Stack gap="md" mt="md">
            <Text size="sm" c="dimmed">
                Review the details below before creating the {form.values.type || "event"}.
            </Text>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <OverviewField label="Name">
                    {form.values.name ? (
                        <Text size="sm" fw={500}>
                            {form.values.name}
                        </Text>
                    ) : (
                        <OverviewEmpty />
                    )}
                </OverviewField>

                <OverviewField label="Type">
                    {form.values.type ? <TournamentTypeBadge type={form.values.type} withText /> : <OverviewEmpty />}
                </OverviewField>

                <OverviewField label="Game Modes">
                    {form.values.modes.length > 0 ? <GameModeIcon mode={form.values.modes} /> : <OverviewEmpty />}
                </OverviewField>

                <OverviewField label="Dates">
                    {form.values.startDate && form.values.endDate ? (
                        <Text size="sm">
                            {dayjs(form.values.startDate).format("MMM D, YYYY")} –{" "}
                            {dayjs(form.values.endDate).format("MMM D, YYYY")}
                        </Text>
                    ) : (
                        <OverviewEmpty />
                    )}
                </OverviewField>
            </SimpleGrid>

            <OverviewField label="Hosts">
                {selectedHosts.length > 0 ? (
                    <Text size="sm" c="dimmed">
                        {utils.formatElementsList(
                            selectedHosts.map((host) => (
                                <UserLink key={host.id} fw={500} user={host} displayActiveInfringement />
                            )),
                        )}
                    </Text>
                ) : (
                    <OverviewEmpty />
                )}
            </OverviewField>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <OverviewField label="Forum Link">
                    {form.values.forumUrl ? (
                        <Anchor href={form.values.forumUrl} target="_blank" size="sm" lineClamp={1}>
                            {form.values.forumUrl}
                        </Anchor>
                    ) : (
                        <OverviewEmpty />
                    )}
                </OverviewField>

                <OverviewField label="Enchant URL">
                    {form.values.enchantUrl ? (
                        <Anchor href={form.values.enchantUrl} target="_blank" size="sm" lineClamp={1}>
                            {form.values.enchantUrl}
                        </Anchor>
                    ) : (
                        <OverviewEmpty />
                    )}
                </OverviewField>
            </SimpleGrid>

            <OverviewField label="Banner">
                {form.values.bannerUrl ? (
                    <Image src={form.values.bannerUrl} alt="Banner preview" w="100%" radius="sm" fit="contain" />
                ) : (
                    <OverviewEmpty />
                )}
            </OverviewField>

            <OverviewField label="Extra Links">
                {form.values.extraLinks.length > 0 ? (
                    <Box
                        style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            columnGap: "var(--mantine-spacing-xs)",
                            rowGap: 4,
                            alignItems: "center",
                        }}>
                        {form.values.extraLinks.map((link, index) => (
                            <Fragment key={`${link.type}-${link.url}-${index}`}>
                                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                    <ExtraLinkTypeIcon type={link.type} />
                                    <Text size="sm" fw={500} lineClamp={1}>
                                        {link.name}
                                    </Text>
                                </Group>
                                <Anchor
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="sm"
                                    lineClamp={1}
                                    style={{ minWidth: 0 }}>
                                    {link.url}
                                </Anchor>
                            </Fragment>
                        ))}
                    </Box>
                ) : (
                    <OverviewEmpty />
                )}
            </OverviewField>

            <OverviewField label="Search Tags">
                {form.values.tags.length > 0 ? (
                    <Group gap="xs">
                        {form.values.tags.map((tag) => (
                            <Pill key={tag}>{tag}</Pill>
                        ))}
                    </Group>
                ) : (
                    <OverviewEmpty />
                )}
            </OverviewField>

            <OverviewField label="Winners">
                {selectedWinners.length > 0 ? (
                    <List spacing="4" size="sm">
                        {selectedWinners.map((winner) => (
                            <List.Item key={winner.id}>
                                <Text size="sm">
                                    <UserLink fw={500} user={winner} displayActiveInfringement />
                                </Text>
                            </List.Item>
                        ))}
                    </List>
                ) : (
                    <OverviewEmpty />
                )}
            </OverviewField>

            <OverviewField label="Badges">
                {badgePreviewUrls.length > 0 ? (
                    <Group gap="sm">
                        {badgePreviewUrls.map((badge) => (
                            <Image
                                key={badge.url}
                                src={badge.url}
                                alt={badge.name}
                                h={40}
                                w="auto"
                                radius="sm"
                                fit="contain"
                            />
                        ))}
                    </Group>
                ) : (
                    <OverviewEmpty />
                )}
            </OverviewField>

            <OverviewField label="Discord Thread">
                {form.values.threadId ? <Text size="sm">{form.values.threadId}</Text> : <OverviewEmpty />}
            </OverviewField>
        </Stack>
    );
}
