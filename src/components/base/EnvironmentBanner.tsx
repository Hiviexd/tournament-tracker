import { Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useStatus } from "../../hooks/useStatus";
import utils from "../../../utils";

export default function EnvironmentBanner() {
    const { data: status } = useStatus();
    const version = status?.version;

    // we need to use Vite's import.meta.env because process.env is not available prod builds
    const isDevelopment = import.meta.env.MODE === "development";
    const isPreview = import.meta.env.MODE === "preview";
    const isProduction = import.meta.env.PROD && !isDevelopment && !isPreview;

    if (isProduction) {
        return null;
    }

    const getEnvironmentColor = () => {
        if (isDevelopment) {
            return "var(--mantine-color-yellow-9)";
        }
        if (isPreview) {
            return "var(--mantine-color-primary-9)";
        }
        return "var(--mantine-color-orange-9)";
    };

    const environmentName = import.meta.env.MODE ? import.meta.env.MODE.toUpperCase() : "UNKNOWN ENVIRONMENT";

    const getBranchStatusText = () => {
        if (!isPreview || !version?.branchStatus) {
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
            return "[up to date]";
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
