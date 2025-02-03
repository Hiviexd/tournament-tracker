import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { Container, Stack, Text, Loader } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ErrorPage() {
    const navigate = useNavigate();

    useEffect(() => {
        notifications.show({
            title: "Error",
            message: "An unexpected error occurred, try again.",
            color: "red",
            autoClose: 3000,
        });

        const timeout = setTimeout(() => {
            navigate("/");
        }, 1000);

        return () => clearTimeout(timeout);
    }, [navigate]);

    return (
        <Container h="50vh">
            <Stack justify="center" align="center" h="100%" gap="md">
                <FontAwesomeIcon icon="exclamation-circle" size="3x" style={{ opacity: 0.5 }} />
                <Text size="xl" fw={500}>
                    Something went wrong
                </Text>
                <Text c="dimmed">Redirecting you to the homepage...</Text>
                <Loader color="primary" size="sm" />
            </Stack>
        </Container>
    );
}
