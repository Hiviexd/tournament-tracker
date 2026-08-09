import { SnowOverlay as ReactSnowOverlay } from "react-snow-overlay";
import { useAtomValue } from "jotai";
import { seasonalEffectsAtom } from "../../store/atoms";

export default function SnowOverlay() {
    const seasonalEffects = useAtomValue(seasonalEffectsAtom);
    const isDecember = new Date().getMonth() === 11;

    return (
        <ReactSnowOverlay
            maxParticles={50}
            color="rgba(255, 255, 255, 0.4)"
            speed="FAST"
            disabled={!seasonalEffects || !isDecember}
            disabledOnSingleCpuDevices={true}
        />
    );
}
