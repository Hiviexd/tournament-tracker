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
        return (
            <Group gap={0} wrap="nowrap">
                {mode.map((m) => (
                    <Tooltip label={getModeName(m)}>
                        <div key={m} className={`gamemode-icon ${m}`} />
                    </Tooltip>
                ))}
            </Group>
        );
    }

    return (
        <Tooltip label={getModeName(mode)}>
            <div className={`gamemode-icon ${mode}`} />
        </Tooltip>
    );
}
