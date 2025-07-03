import { Select } from "@mantine/core";
import { forwardRef } from "react";
import { TournamentStatus } from "../../../interfaces/Tournament";
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
    includeAdminOnly?: boolean; // Whether to include admin-only options
}

const StatusOption = forwardRef<HTMLDivElement, { value: string; label: string }>((props, ref) => (
    <div ref={ref} {...props}>
        <TournamentStatusBadge status={props.value as TournamentStatus} size="sm" />
    </div>
));

export default function TournamentStatusSelect({
    value,
    leftSection,
    onChange,
    placeholder = "Select status",
    clearable = true,
    searchable = true,
    disabled = false,
    allowDeselect = true,
    includeAdminOnly = true,
}: TournamentStatusSelectProps) {
    const statusOptions = [
        {
            group: "Initial Request",
            items: [
                { value: "supportRequestReceived", label: "Support Request Received" },
                ...(includeAdminOnly ? [{ value: "screeningConcluded", label: "Screening Concluded" }] : []),
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
            searchable={searchable}
            clearable={clearable}
            disabled={disabled}
            allowDeselect={allowDeselect}
            leftSection={leftSection}
        />
    );
}
