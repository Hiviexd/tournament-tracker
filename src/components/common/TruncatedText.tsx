import { useState, useRef, useEffect } from "react";
import { Tooltip, Text } from "@mantine/core";

interface IProps {
    children: string;
    lineClamp?: number;
    textProps?: React.ComponentProps<typeof Text>;
    tooltipProps?: Omit<React.ComponentProps<typeof Tooltip>, "label" | "children">;
}

/**
 * Truncates text and shows a tooltip when the text is too long.
 * @param children - The text to truncate.
 * @param lineClamp - The number of lines to clamp the text to.
 * @param textProps - Props to pass to the `Text` component.
 * @param tooltipProps - Props to pass to the `Tooltip` component.
 */
export function TruncatedText({ children, lineClamp = 1, textProps, tooltipProps }: IProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [truncated, setTruncated] = useState(false);

    useEffect(() => {
        const el = textRef.current;
        if (el) {
            // Check if content is overflowing
            setTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
        }
    }, [children, lineClamp]);

    const content = (
        <Text ref={textRef} lineClamp={lineClamp} style={{ maxWidth: "100%" }} {...textProps}>
            {children}
        </Text>
    );

    return truncated ? (
        <Tooltip
            label={
                <span style={{ display: "inline-block", maxWidth: 300, textAlign: "center", textWrap: "pretty" }}>
                    {children}
                </span>
            }
            {...tooltipProps}>
            {content}
        </Tooltip>
    ) : (
        content
    );
}
