import { Box, Text } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function DevelopmentBanner() {
    // Only show in development mode
    if (process.env.NODE_ENV !== "development") {
        return null;
    }

    return (
        <Box
            style={{
                position: "sticky",
                bottom: 0,
                width: "100%",
                backgroundColor: "#ff6b35",
                color: "white",
                textAlign: "center",
                padding: "8px 16px",
                fontSize: "12px",
                fontWeight: 600,
                borderTop: "2px solid #e55a2b",
                boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
                zIndex: 100,
            }}>
            <Text size="xs" fw={600}>
                <FontAwesomeIcon icon="code" style={{ marginRight: "6px" }} />
                DEVELOPMENT INSTANCE
            </Text>
        </Box>
    );
}
