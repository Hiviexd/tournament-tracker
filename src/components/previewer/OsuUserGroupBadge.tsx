import { Tooltip } from "@mantine/core";
import { IOsuGroup, OsuGameMode } from "../../../interfaces/OsuApi";
import GameModeIcon from "../common/GameModeIcon";

export default function OsuUserGroupBadge({ group }: { group: IOsuGroup }) {
    const userGroupBadgeContent = (
        <>
            <span style={{ lineHeight: "1em" }}>{group.short_name}</span>
            {group.playmodes && group.playmodes.length > 0 && (
                <div className="gamemode-icons">
                    {group.playmodes.map((mode) => (
                        <div key={mode} style={{ fontWeight: 400 }}>
                            <GameModeIcon mode={mode as OsuGameMode} />
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    if (group.has_listing) {
        return (
            <Tooltip label={group.name}>
                <a
                    href={`https://osu.ppy.sh/groups/${group.id}`}
                    target="_blank"
                    className="usergroup-badge"
                    style={{ color: group.colour }}>
                    {userGroupBadgeContent}
                </a>
            </Tooltip>
        );
    }

    return (
        <Tooltip label={group.name}>
            <div className="usergroup-badge" style={{ color: group.colour }}>
                {userGroupBadgeContent}
            </div>
        </Tooltip>
    );
}
