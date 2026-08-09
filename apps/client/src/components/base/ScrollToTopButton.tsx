import { useWindowScroll } from "@mantine/hooks";
import { Affix, Transition, Button } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IPropTypes {
    style?: React.CSSProperties;
}

export default function ScrollToTopButton({ style }: IPropTypes) {
    const [scroll, scrollTo] = useWindowScroll();

    return (
        <>
            <Affix position={{ bottom: 15, right: 30 }} style={style}>
                <Transition transition="slide-up" mounted={scroll.y > 0}>
                    {(transitionStyles) => (
                        <Button
                            style={{
                                ...transitionStyles,
                                transition: "transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease",
                                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                            }}
                            radius="xl"
                            w="3.5em"
                            h="3.5em"
                            p="0"
                            onClick={() => scrollTo({ y: 0 })}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = `${
                                    transitionStyles.transform || ""
                                } translateY(-4px)`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = transitionStyles.transform || "";
                            }}>
                            <FontAwesomeIcon icon="chevron-up" style={{ fontSize: "1.2em" }} />
                        </Button>
                    )}
                </Transition>
            </Affix>
        </>
    );
}
