import { Card, Stack, ScrollArea } from "@mantine/core";

interface IProps {
    bannerUrl: string;
}

export default function OsuWebPreview({ bannerUrl }: IProps) {
    return (
        <ScrollArea
            type="auto"
            style={{
                width: "100%",
                maxWidth: "100%",
                minHeight: "400px",
            }}>
            <Card className="osu-web-preview" style={{ "--banner-url": `url(${bannerUrl})` } as React.CSSProperties}>
                <Stack gap={0}>
                    <div className="header-section">
                        <div className="header-section-icon" />
                        <span>dashboard</span>
                    </div>
                    <div className="header-nav">
                        <ul className="header-nav-list">
                            <li className="header-nav-item">
                                <a className="header-nav-link active" href="https://osu.ppy.sh/" target="_blank">
                                    <span className="fake-bold">dashboard</span>
                                </a>
                            </li>
                            <li className="header-nav-item">
                                <a className="header-nav-link" href="https://osu.ppy.sh/home/friends" target="_blank">
                                    friends
                                </a>
                            </li>
                            <li className="header-nav-item">
                                <a
                                    className="header-nav-link"
                                    href="https://osu.ppy.sh/home/follows/forum_topic"
                                    target="_blank">
                                    watchlists
                                </a>
                            </li>
                            <li className="header-nav-item">
                                <a
                                    className="header-nav-link"
                                    href="https://osu.ppy.sh/home/account/edit"
                                    target="_blank">
                                    account settings
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="banner-section">
                        <div className="banner-blur"></div>
                        <img src={bannerUrl} alt="banner" className="banner-image" />
                    </div>
                    <div className="content-section"></div>
                </Stack>
            </Card>
        </ScrollArea>
    );
}
