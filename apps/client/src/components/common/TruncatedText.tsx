import { useEffect, useRef, useState } from "react";
import { Text, TextProps, Tooltip, TooltipProps } from "@mantine/core";

type TruncatedTextProps = {
    children: string;
    lineClamp?: number;
    tooltipProps?: Omit<TooltipProps, "label" | "children" | "disabled">;
} & Omit<TextProps, "children" | "lineClamp">;

/** Truncates text and shows a shrink-wrapped tooltip when overflowing. */
export function TruncatedText({ children, lineClamp = 1, tooltipProps, ...textProps }: TruncatedTextProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [truncated, setTruncated] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const update = () => {
            setTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [children, lineClamp]);

    return (
        <Tooltip
            {...tooltipProps}
            disabled={!truncated}
            label={
                <span style={{ display: "inline-block", maxWidth: 300, textAlign: "center", textWrap: "pretty" }}>
                    {children}
                </span>
            }>
            <Text ref={ref} maw="100%" lineClamp={lineClamp} {...textProps}>
                {children}
            </Text>
        </Tooltip>
    );
}
