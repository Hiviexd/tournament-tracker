import { Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useVersion } from "../../hooks/useVersion";
import utils from "../../../utils";

export default function EnvironmentBanner() {
    const { data: version } = useVersion();

    if (process.env.NODE_ENV === "production") {
        return null;
    }

    const getEnvironmentColor = () => {
        switch (process.env.NODE_ENV) {
            case "development":
                return "var(--mantine-color-yellow-9)";
            case "preview":
                return "var(--mantine-color-primary-9)";
            default:
                return "var(--mantine-color-orange-9)";
        }
    };

    const environmentName = process.env.NODE_ENV ? process.env.NODE_ENV.toUpperCase() : "UNKNOWN ENVIRONMENT";

    const getBranchStatusText = () => {
        if (process.env.NODE_ENV !== "preview" || !version?.branchStatus) {
            return "";
        }

        const { ahead, behind } = version.branchStatus;
        const statusParts: string[] = [];

        if (behind && behind > 0) {
            statusParts.push(`${utils.formatCount(behind, "commit")} behind`);
        }
        if (ahead && ahead > 0) {
            statusParts.push(`${utils.formatCount(ahead, "commit")} ahead`);
        }

        if (statusParts.length === 0) {
            return "";
        }

        return `[${statusParts.join(", ")}]`;
    };

    return (
        <Box
            className="environment-banner"
            style={
                {
                    "--environment-banner-background": getEnvironmentColor(),
                } as React.CSSProperties
            }>
            <Text size="xs" fw={600} className="banner-text">
                <FontAwesomeIcon icon="code" />
                {environmentName} INSTANCE {getBranchStatusText().toUpperCase()}
            </Text>
        </Box>
    );
}
