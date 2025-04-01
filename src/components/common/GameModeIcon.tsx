import { GameMode } from "../../../interfaces/Tournament";
import { Group } from "@mantine/core";
import { Tooltip } from "@mantine/core";

interface Props {
    mode: GameMode | GameMode[];
}

export default function GameModeIcon({ mode }: Props) {
    function getModeName(mode: GameMode) {
        switch (mode) {
            case "osu":
                return "osu!";
            case "taiko":
                return "osu!taiko";
            case "catch":
                return "osu!catch";
            case "mania":
                return "osu!mania";
        }
    }

    if (Array.isArray(mode)) {
        // order modes, osu -> taiko -> catch -> mania
        const orderedModes = mode.sort((a: GameMode, b: GameMode) => {
            const order = ["osu", "taiko", "catch", "mania"];
            return order.indexOf(a) - order.indexOf(b);
        });

        return (
            <Group gap={0} wrap="nowrap">
                {orderedModes.map((m) => (
                    <Tooltip key={m} label={getModeName(m)}>
                        <div key={m} className={`gamemode-icon ${m}`} />
                    </Tooltip>
                ))}
            </Group>
        );
    }

    return (
        <Tooltip key={mode} label={getModeName(mode)}>
            <div key={mode} className={`gamemode-icon ${mode}`} />
        </Tooltip>
    );
}
