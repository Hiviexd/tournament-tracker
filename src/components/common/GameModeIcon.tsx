import { GameMode } from "../../../interfaces/Tournament";
import { Group } from "@mantine/core";

interface Props {
    mode: GameMode | GameMode[];
}

export default function GameModeIcon({ mode }: Props) {
    if (Array.isArray(mode)) {
        return (
            <Group gap={0} wrap="nowrap">
                {mode.map((m) => (
                    <div key={m} className={`gamemode-icon ${m}`} />
                ))}
            </Group>
        );
    }

    return <div className={`gamemode-icon ${mode}`} />;
}
