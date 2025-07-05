import { useWindowScroll } from "@mantine/hooks";
import { Affix, Button, Transition } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IPropTypes {
    style?: React.CSSProperties;
}

export default function ScrollToTopButton({ style }: IPropTypes) {
    const [scroll, scrollTo] = useWindowScroll();

    return (
        <>
            <Affix position={{ bottom: 10, right: 20 }} style={style}>
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
