import {
    Modal,
    Stack,
    Table,
    TextInput,
    Button,
    Group,
    Text,
    Code,
    Image,
    Box,
    Combobox,
    InputBase,
    ScrollArea,
    useCombobox
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ITournament } from "../../../../interfaces/Tournament";
import UserDisplay from "../../common/UserDisplay";
import { useDownloadBadges } from "../../../hooks/useTournaments";
import utils from "../../../../utils";
import { useState, useRef } from "react";

interface IProps {
    opened: boolean;
    onClose: () => void;
    tournament: ITournament;
}

interface AwardFormData {
    winners: {
        winner: any;
        badgeIndex: number;
        filename: string;
        description: string;
    }[];
}

const BadgeOption = ({ badge, index }: { badge: { url: string }; index: number }) => {
    if (!badge?.url) return null;

    return (
        <Group gap="xs">
            <Image src={badge.url} alt={`Badge ${index + 1}`} w={86} h={40} radius="0" />
        </Group>
    );
};

interface WinnerRowProps {
    winnerData: AwardFormData["winners"][0];
    index: number;
    badges: { url: string }[];
    form: any;
}

const WinnerRow = ({ winnerData, index, badges, form }: WinnerRowProps) => {
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const buttonRef = useRef<HTMLButtonElement>(null);
    const isSingleBadge = badges.length === 1;
    const isFirstRow = index === 0;

    const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value;
        form.setFieldValue(`winners.${index}.filename`, newValue);

        // If single badge, update all other rows
        if (isSingleBadge && isFirstRow) {
            form.values.winners.forEach((_, i) => {
                if (i !== index) {
                    form.setFieldValue(`winners.${i}.filename`, newValue);
                }
            });
        }
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.currentTarget.value;
        form.setFieldValue(`winners.${index}.description`, newValue);

        // If single badge, update all other rows
        if (isSingleBadge && isFirstRow) {
            form.values.winners.forEach((_, i) => {
                if (i !== index) {
                    form.setFieldValue(`winners.${i}.description`, newValue);
                }
            });
        }
    };

    return (
        <Table.Tr>
            <Table.Td>
                <UserDisplay user={winnerData.winner} />
            </Table.Td>
            <Table.Td>
                {badges.length > 1 ? (
                    <Combobox
                        store={combobox}
                        onOptionSubmit={(value) => {
                            form.setFieldValue(`winners.${index}.badgeIndex`, Number(value));
                            combobox.closeDropdown();
                        }}>
                        <Combobox.Target>
                            <InputBase
                                component="button"
                                type="button"
                                pointer
                                rightSection={<Combobox.Chevron />}
                                onClick={() => combobox.toggleDropdown()}
                                ref={buttonRef}
                                w={130}
                                h={50}
                                styles={{
                                    input: {
                                        height: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "4px 8px",
                                    },
                                }}>
                                <BadgeOption badge={badges[winnerData.badgeIndex]} index={winnerData.badgeIndex} />
                            </InputBase>
                        </Combobox.Target>

                        <Combobox.Dropdown>
                            <Combobox.Options>
                                {badges.map((badge, i) => (
                                    <Combobox.Option
                                        value={i.toString()}
                                        key={i}
                                        styles={{
                                            option: {
                                                padding: "8px",
                                                height: "auto",
                                            },
                                        }}>
                                        <BadgeOption badge={badge} index={i} />
                                    </Combobox.Option>
                                ))}
                            </Combobox.Options>
                        </Combobox.Dropdown>
                    </Combobox>
                ) : badges.length === 1 ? (
                    <BadgeOption badge={badges[0]} index={0} />
                ) : (
                    <Text>No badges available</Text>
                )}
            </Table.Td>
            <Table.Td>
                <TextInput
                    value={winnerData.filename}
                    onChange={handleFilenameChange}
                    disabled={isSingleBadge && !isFirstRow}
                />
            </Table.Td>
            <Table.Td>
                <TextInput
                    value={winnerData.description}
                    onChange={handleDescriptionChange}
                    disabled={isSingleBadge && !isFirstRow}
                />
            </Table.Td>
        </Table.Tr>
    );
};

export default function TournamentAwardsManager({ opened, onClose, tournament }: IProps) {
    const downloadBadgesMutation = useDownloadBadges(tournament.id);
    const badges = tournament.badges || [];
    const [generatedCommands, setGeneratedCommands] = useState<string[]>([]);

    const form = useForm<AwardFormData>({
        initialValues: {
            winners:
                tournament.winners?.map((winner) => ({
                    winner,
                    badgeIndex: 0,
                    filename: generateDefaultFilename(tournament.name, winner.username),
                    description: generateDefaultDescription(tournament.name, tournament.winners?.length || 0),
                })) || [],
        },
    });

    // Update form values when tournament data changes
    if (opened) {
        const currentWinners = form.values.winners.map((w) => w.winner.id);
        const newWinners = tournament.winners?.map((w) => w.id) || [];

        // Only update if winners have changed
        if (JSON.stringify(currentWinners) !== JSON.stringify(newWinners)) {
            form.setValues({
                winners:
                    tournament.winners?.map((winner) => ({
                        winner,
                        badgeIndex: 0,
                        filename: generateDefaultFilename(tournament.name, winner.username),
                        description: generateDefaultDescription(tournament.name, tournament.winners?.length || 0),
                    })) || [],
            });
        }
    }

    function generateDefaultFilename(tournamentName: string, username: string) {
        const baseName = tournamentName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
        const isSingleBadge = badges.length === 1;
        return `${baseName}-${isSingleBadge ? "winner" : username.toLowerCase()}`;
    }

    function generateDefaultDescription(tournamentName: string, winnerCount: number) {
        const isSingleBadge = badges.length === 1;
        if (isSingleBadge) {
            return winnerCount === 1 ? `${tournamentName} Winner` : `${tournamentName} Winning Team`;
        }
        return `${tournamentName} Winner`;
    }

    const handleGenerateCommands = () => {
        // Group winners by their badge assignment (filename and description)
        const groupedWinners = form.values.winners.reduce((acc, winnerData) => {
            const badge = badges[winnerData.badgeIndex];
            if (!badge?.url) return acc;

            const ext = badge.url.split(".").pop();
            const key = `${winnerData.filename}.${ext}|${winnerData.description}`;

            if (!acc[key]) {
                acc[key] = {
                    userIds: [],
                    filename: `${winnerData.filename}.${ext}`,
                    description: winnerData.description,
                    forumUrl: tournament.forumUrl,
                };
            }
            acc[key].userIds.push(winnerData.winner.osuId);
            return acc;
        }, {} as Record<string, { userIds: string[]; filename: string; description: string; forumUrl: string }>);

        // Generate commands from grouped winners
        const commands = Object.values(groupedWinners).map(
            ({ userIds, filename, description, forumUrl }) =>
                `.add-badge ${userIds.join(",")} ${filename} "${description}" ${forumUrl}`
        );

        setGeneratedCommands(commands);

        // Copy to clipboard
        utils.copyToClipboard(commands.join("\n"));
    };

    const handleDownloadBadges = async () => {
        const filenames = form.values.winners.map((winnerData) => ({
            badgeId: badges[winnerData.badgeIndex].id,
            filename: winnerData.filename,
        }));
        console.log(filenames);
        await downloadBadgesMutation.mutateAsync(filenames);
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Awards Manager" size="70%">
            <Stack gap="md">
                <ScrollArea>
                    <Table miw={{ base: 1200, sm: 700 }}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Winner</Table.Th>
                                <Table.Th>Badge</Table.Th>
                                <Table.Th>Filename</Table.Th>
                                <Table.Th>Description</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {form.values.winners.map((winnerData, index) => (
                                <WinnerRow
                                    key={winnerData.winner.id}
                                    winnerData={winnerData}
                                    index={index}
                                    badges={badges}
                                    form={form}
                                />
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                {generatedCommands.length > 0 && (
                    <Box>
                        <Text size="sm" fw={500} mb="xs">
                            Generated Commands:
                        </Text>
                        <Code block color="primary.10">
                            {generatedCommands.join("\n")}
                        </Code>
                    </Box>
                )}

                <Group justify="flex-end">
                    <Button
                        variant="light"
                        onClick={handleGenerateCommands}
                        leftSection={<FontAwesomeIcon icon="code" />}>
                        Generate Commands
                    </Button>
                    <Button
                        onClick={handleDownloadBadges}
                        loading={downloadBadgesMutation.isPending}
                        leftSection={<FontAwesomeIcon icon="download" />}>
                        Download Badges
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}
