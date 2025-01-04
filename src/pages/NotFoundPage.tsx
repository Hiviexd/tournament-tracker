import { Container, Stack, Text, Button } from '@mantine/core';
import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <Container h="50vh">
            <Stack justify="center" align="center" h="100%">
                <Text size="120px">:(</Text>
                <Text size="xl" fw={500}>Page Not Found</Text>
                <Button
                    component={Link}
                    to="/"
                    variant="subtle"
                >
                    Return to Home
                </Button>
            </Stack>
        </Container>
    );
}