import { useWindowScroll } from "@mantine/hooks";
import { Affix, Button, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ScrollToTopButton() {
    const [scroll, scrollTo] = useWindowScroll();

    return (
        <>
            <Affix position={{ bottom: 20, right: 20 }}>
                <Transition transition="slide-up" mounted={scroll.y > 0}>
                    {(transitionStyles) => (
                        <Button
                            leftSection={<FontAwesomeIcon icon="arrow-up" />}
                            style={transitionStyles}
                            onClick={() => scrollTo({ y: 0 })}>
                            Scroll to top
                        </Button>
                    )}
                </Transition>
            </Affix>
        </>
    );
}
