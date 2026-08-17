import { useState } from "react";
import { useCreateTournament } from "../../hooks/useTournaments";
import { Modal, Stack, Button, Group, LoadingOverlay, Stepper } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useFileUpload } from "../../hooks/useFileUpload";
import utils from "@tc/utils/client";
import { useNavigate } from "react-router";
import { IUser } from "@tc/types/User";
import {
    STEPS,
    STEP_FIELDS,
    badgeUploadOptions,
    initialFormValues,
    TournamentCreateFormValues,
} from "./create/tournamentCreateForm";
import TournamentCreateBasicsStep from "./create/TournamentCreateBasicsStep";
import TournamentCreateMetadataStep from "./create/TournamentCreateMetadataStep";
import TournamentCreateConclusionStep from "./create/TournamentCreateConclusionStep";
import TournamentCreateOverviewStep from "./create/TournamentCreateOverviewStep";

interface IProps {
    opened: boolean;
    onClose: () => void;
}

export default function TournamentCreateModal({ opened, onClose }: IProps) {
    const createTournamentMutation = useCreateTournament();
    const [selectedHosts, setSelectedHosts] = useState<IUser[]>([]);
    const [selectedWinners, setSelectedWinners] = useState<IUser[]>([]);
    const [active, setActive] = useState(0);
    const [isUploadingBadges, setIsUploadingBadges] = useState(false);
    const { files, handleFileChange, clearFiles, error: fileError } = useFileUpload(badgeUploadOptions);
    const navigate = useNavigate();

    const form = useForm<TournamentCreateFormValues>({
        initialValues: initialFormValues,
        validate: {
            name: (value) => {
                if (!value) return "Name is required";
                if (!utils.isLatinScriptOnly(value)) return "Name must be in Latin script (no Cyrillic, Chinese, etc.)";
                return null;
            },
            hostIds: (value) => (value.length === 0 ? "At least one host is required" : null),
            modes: (value) => (value.length === 0 ? "At least one game mode is required" : null),
            type: (value) => (!value ? "Type is required" : null),
            forumUrl: (value) => {
                if (value && !utils.isOsuForumLink(value)) return "Invalid osu! forum URL";
            },
            bannerUrl: (value) => {
                if (value && !utils.isValidUrl(value)) return "Invalid URL";
            },
            enchantUrl: (value) => {
                if (value && !utils.isEnchantTicketLink(value)) return "Invalid Enchant ticket URL";
            },
            startDate: (value) => (!value ? "Start date is required" : null),
            endDate: (value, values) => {
                if (!value) return "End date is required";
                if (values.startDate && value < values.startDate) {
                    return "End date must be after start date";
                }
                return null;
            },
            extraLinks: (value) => utils.validateExtraLinks(value),
        },
    });

    const resetFormState = () => {
        form.reset();
        setSelectedHosts([]);
        setSelectedWinners([]);
        clearFiles();
        setActive(0);
    };

    const handleClose = () => {
        resetFormState();
        onClose();
    };

    const handleHostsChange = (hosts: IUser[]) => {
        setSelectedHosts(hosts);
        form.setFieldValue(
            "hostIds",
            hosts.map((h) => h.id),
        );
    };

    const validateStep = (step: number) => {
        const fields = STEP_FIELDS[step];
        let hasError = false;
        for (const field of fields) {
            const result = form.validateField(field);
            if (result.hasError) hasError = true;
        }
        return !hasError;
    };

    const nextStep = () => {
        if (!validateStep(active)) return;
        setActive((current) => Math.min(current + 1, STEPS.length - 1));
    };

    const prevStep = () => {
        setActive((current) => Math.max(current - 1, 0));
    };

    const handleSubmit = async (values: TournamentCreateFormValues) => {
        if (active !== STEPS.length - 1) return;
        if (!validateStep(active)) return;

        try {
            const res = await createTournamentMutation.mutateAsync({
                ...values,
                threadId: values.threadId || undefined,
                winners: selectedWinners,
            });

            const tournamentId = res.tournament._id?.toString?.() ?? res.tournament.id;

            if (files.length > 0 && tournamentId) {
                setIsUploadingBadges(true);
                try {
                    const formData = new FormData();
                    files.forEach((file) => formData.append("files", file));
                    const uploadResponse = await utils.apiCall({
                        method: "post",
                        url: `/api/tournaments/${tournamentId}/uploadBadges`,
                        data: formData,
                        headers: { "Content-Type": "multipart/form-data" },
                    });
                    if (uploadResponse.error) {
                        notifications.show({
                            title: "Badge upload failed",
                            message:
                                "Tournament was created, but badges could not be uploaded. You can retry from the tournament page.",
                            color: "orange",
                        });
                    }
                } catch (error) {
                    console.error("Failed to upload badges:", error);
                    notifications.show({
                        title: "Badge upload failed",
                        message:
                            "Tournament was created, but badges could not be uploaded. You can retry from the tournament page.",
                        color: "orange",
                    });
                } finally {
                    setIsUploadingBadges(false);
                }
            }

            resetFormState();
            onClose();
            navigate(`/tournaments/${tournamentId}`);
        } catch (error) {
            console.error("Failed to create tournament:", error);
        }
    };

    const handleCreateClick = () => {
        if (active !== STEPS.length - 1) return;
        form.onSubmit(handleSubmit, () => {
            for (let i = 0; i < STEP_FIELDS.length; i++) {
                if (!validateStep(i)) {
                    setActive(i);
                    return;
                }
            }
        })();
    };

    const isPending = createTournamentMutation.isPending || isUploadingBadges;
    const isLastStep = active === STEPS.length - 1;

    return (
        <Modal opened={opened} onClose={handleClose} title="Create New Tournament" size="xl">
            <LoadingOverlay visible={isPending} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            <form onSubmit={(event) => event.preventDefault()}>
                <Stack gap="md">
                    <Stepper active={active} onStepClick={setActive} size="sm">
                        <Stepper.Step label="Basics" description="Core details">
                            <TournamentCreateBasicsStep
                                form={form}
                                selectedHosts={selectedHosts}
                                onHostsChange={handleHostsChange}
                            />
                        </Stepper.Step>

                        <Stepper.Step label="Metadata" description="Tags & links">
                            <TournamentCreateMetadataStep form={form} />
                        </Stepper.Step>

                        <Stepper.Step label="Conclusion" description="Winners & badges">
                            <TournamentCreateConclusionStep
                                form={form}
                                selectedWinners={selectedWinners}
                                onWinnersChange={setSelectedWinners}
                                files={files}
                                onFilesChange={handleFileChange}
                                fileError={fileError}
                            />
                        </Stepper.Step>

                        <Stepper.Step label="Overview" description="Review & create">
                            <TournamentCreateOverviewStep
                                form={form}
                                selectedHosts={selectedHosts}
                                selectedWinners={selectedWinners}
                                files={files}
                            />
                        </Stepper.Step>
                    </Stepper>

                    <Group justify="space-between" mt="md">
                        <Button type="button" variant="subtle" onClick={handleClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Group gap="xs">
                            {active > 0 && (
                                <Button type="button" variant="default" onClick={prevStep} disabled={isPending}>
                                    Back
                                </Button>
                            )}
                            {isLastStep ? (
                                <Button
                                    key="create"
                                    type="button"
                                    onClick={handleCreateClick}
                                    loading={isPending}
                                    disabled={selectedHosts.some((host) => host.activeInfringement)}>
                                    Create Tournament
                                </Button>
                            ) : (
                                <Button key="next" type="button" onClick={nextStep} disabled={isPending}>
                                    Next
                                </Button>
                            )}
                        </Group>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
