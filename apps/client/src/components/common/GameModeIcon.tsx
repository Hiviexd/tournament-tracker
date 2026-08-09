import { OsuGameMode } from "@tc/types/OsuApi";
import { GameMode } from "@tc/types/Tournament";
import { Group } from "@mantine/core";
import { Tooltip } from "@mantine/core";

interface Props {
    mode: GameMode | OsuGameMode | (GameMode | OsuGameMode)[];
    noTooltip?: boolean;
}

export default function GameModeIcon({ mode, noTooltip = false }: Props) {
    function getModeName(mode: GameMode | OsuGameMode) {
        switch (mode) {
            case "osu":
                return "osu!";
            case "taiko":
                return "osu!taiko";
            case "catch":
            case "fruits":
                return "osu!catch";
            case "mania":
                return "osu!mania";
        }
    }

    if (Array.isArray(mode)) {
        // order modes, osu -> taiko -> catch/fruits -> mania
        const orderedModes = mode.sort((a: GameMode | OsuGameMode, b: GameMode | OsuGameMode) => {
            const order = ["osu", "taiko", "catch", "fruits", "mania"];
            return order.indexOf(a) - order.indexOf(b);
        });

        return (
            <Group gap={0} wrap="nowrap">
                {orderedModes.map((m) =>
                    noTooltip ? (
                        <div key={m} className={`gamemode-icon ${m}`} />
                    ) : (
                        <Tooltip key={m} label={getModeName(m)}>
                            <div key={m} className={`gamemode-icon ${m}`} />
                        </Tooltip>
                    ),
                )}
            </Group>
        );
    }

    return noTooltip ? (
        <div key={mode} className={`gamemode-icon ${mode}`} />
    ) : (
        <Tooltip key={mode} label={getModeName(mode)}>
            <div key={mode} className={`gamemode-icon ${mode}`} />
        </Tooltip>
    );
}
