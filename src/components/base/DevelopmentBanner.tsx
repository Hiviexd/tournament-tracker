import { Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DevelopmentBanner() {
    // Only show in development mode
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return (
        <Box className="development-banner">
            <Text size="xs" fw={600} className="banner-text">
                <FontAwesomeIcon icon="code" />
                DEVELOPMENT INSTANCE
            </Text>
        </Box>
    );
}
