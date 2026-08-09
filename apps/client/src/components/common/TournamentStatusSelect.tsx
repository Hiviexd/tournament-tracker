import { Select } from "@mantine/core";
import type { HTMLAttributes, Ref } from "react";
import { TournamentStatus } from "@tc/types/Tournament";
import TournamentStatusBadge from "./badges/TournamentStatusBadge";

interface TournamentStatusSelectProps {
    value: TournamentStatus | "";
    leftSection?: React.ReactNode;
    onChange: (value: TournamentStatus | null) => void;
    placeholder?: string;
    clearable?: boolean;
    searchable?: boolean;
    disabled?: boolean;
    allowDeselect?: boolean;
    label?: string;
}

function StatusOption({
    ref,
    value,
    label,
    ...props
}: { value: string; label: string; ref?: Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>) {
    return (
        <div ref={ref} aria-label={label} {...props}>
            <TournamentStatusBadge status={value as TournamentStatus} size="sm" />
        </div>
    );
}

export default function TournamentStatusSelect({
    value,
    leftSection,
    onChange,
    placeholder = "Select status",
    clearable = true,
    disabled = false,
    allowDeselect = true,
    label = undefined,
}: TournamentStatusSelectProps) {
    const statusOptions = [
        {
            group: "Initial Request",
            items: [
                { value: "supportRequestReceived", label: "Support Request Received" },
                { value: "screeningConcluded", label: "Screening Concluded" },
            ],
        },
        {
            group: "Review Process",
            items: [
                { value: "reviewOngoing", label: "Under Review" },
                { value: "onHold", label: "On Hold" },
                { value: "changesRequested", label: "Changes Requested" },
            ],
        },
        {
            group: "Consensus",
            items: [
                { value: "badgeApproved", label: "Badge Approved" },
                { value: "badgeRejected", label: "Badge Rejected" },
                { value: "noBadgeRequested", label: "No Badge Requested" },
            ],
        },
    ];

    return (
        <Select
            placeholder={placeholder}
            value={value}
            onChange={(value) => onChange(value as TournamentStatus | null)}
            data={statusOptions}
            renderOption={(item) => <StatusOption value={item.option.value} label={item.option.label} />}
            clearable={clearable}
            disabled={disabled}
            allowDeselect={allowDeselect}
            leftSection={leftSection}
            label={label ?? undefined}
        />
    );
}
