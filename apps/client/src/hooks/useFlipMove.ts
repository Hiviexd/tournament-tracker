import { useLayoutEffect, useRef } from "react";

const MOVE_DURATION_MS = 250;
const MOVE_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";

/**
 * Animates direct `[data-flip-id]` children when they change order.
 * Positions are tracked relative to the parent so nested lists don't double-move.
 */
export function useFlipMove<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);
    const prevPositions = useRef(new Map<string, { top: number; left: number }>());

    useLayoutEffect(() => {
        const parent = ref.current;
        if (!parent) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const parentRect = parent.getBoundingClientRect();
        const nextPositions = new Map<string, { top: number; left: number }>();

        for (const element of parent.querySelectorAll<HTMLElement>(":scope > [data-flip-id]")) {
            const id = element.dataset.flipId;
            if (!id) continue;

            const rect = element.getBoundingClientRect();
            const position = { top: rect.top - parentRect.top, left: rect.left - parentRect.left };
            nextPositions.set(id, position);

            const previous = prevPositions.current.get(id);
            if (reducedMotion || !previous) continue;

            const dx = previous.left - position.left;
            const dy = previous.top - position.top;
            if (dx === 0 && dy === 0) continue;

            element.getAnimations().forEach((animation) => animation.cancel());
            element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }], {
                duration: MOVE_DURATION_MS,
                easing: MOVE_EASING,
            });
        }

        prevPositions.current = nextPositions;
    });

    return ref;
}
