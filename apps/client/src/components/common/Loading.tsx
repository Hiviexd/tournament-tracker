import { Flex, Loader } from "@mantine/core";

export default function Loading() {
    return (
        <Flex
            style={{
                height: "100vh",
                width: "100vw",
                position: "fixed",
                top: 0,
                left: 0,
                zIndex: 1000,
            }}
            align="center"
            justify="center">
            <Loader color="primary" size={50} />
        </Flex>
    );
}
