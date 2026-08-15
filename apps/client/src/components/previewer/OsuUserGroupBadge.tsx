import { Tooltip } from "@mantine/core";
import { IOsuGroup } from "@tc/types/OsuApi";
import GameModeIcon from "../common/GameModeIcon";

export default function OsuUserGroupBadge({ group }: { group: IOsuGroup }) {
    const userGroupBadgeContent = (
        <>
            <span style={{ lineHeight: "1em" }}>{group.short_name}</span>
            {group.playmodes && group.playmodes.length > 0 && (
                <div className="gamemode-icons" id={`preview-gamemode-icons-${group.id}`}>
                    {group.playmodes.map((mode) => (
                        <div key={mode} style={{ fontWeight: 400 }}>
                            <GameModeIcon mode={mode} noTooltip />
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    if (group.has_listing) {
        return (
            <Tooltip
                label={group.name}
                arrowSize={10}
                styles={{
                    tooltip: {
                        textAlign: "center",
                        border: "none",
                        backgroundColor: "hsl(333, 10%, 10%)",
                    },
                    arrow: {
                        border: "none",
                    },
                }}>
                <a
                    href={`https://osu.ppy.sh/groups/${group.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="usergroup-badge"
                    style={{ color: group.colour }}>
                    {userGroupBadgeContent}
                </a>
            </Tooltip>
        );
    }

    return (
        <Tooltip
            label={group.name}
            arrowSize={10}
            styles={{
                tooltip: {
                    textAlign: "center",
                    border: "none",
                    backgroundColor: "hsl(333, 10%, 10%)",
                },
                arrow: {
                    border: "none",
                },
            }}>
            <div className="usergroup-badge" style={{ color: group.colour }}>
                {userGroupBadgeContent}
            </div>
        </Tooltip>
    );
}
