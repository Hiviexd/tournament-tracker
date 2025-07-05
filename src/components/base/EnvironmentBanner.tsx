import { Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function EnvironmentBanner() {
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
                {environmentName} INSTANCE
            </Text>
        </Box>
    );
}
