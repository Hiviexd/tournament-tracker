import { Card, Stack, ScrollArea } from "@mantine/core";
import utils from "../../../utils";

interface IProps {
    bannerUrl: string;
}

export default function OsuWebPreview({ bannerUrl }: IProps) {
    const safeBannerUrl = utils.isValidUrl(bannerUrl, { allowedProtocols: ["https", "blob"] }) ? bannerUrl : null;
    return (
        <ScrollArea
            type="auto"
            style={{
                width: "100%",
                maxWidth: "100%",
                minHeight: "400px",
            }}>
            <Card
                className="osu-web-preview"
                style={
                    safeBannerUrl
                        ? ({ "--banner-url": `url(${safeBannerUrl})` } as React.CSSProperties)
                        : ({ "--banner-url": "none" } as React.CSSProperties)
                }>
                <Stack gap={0}>
                    <div className="header-section">
                        <div className="header-section-icon" />
                        <span>dashboard</span>
                    </div>
                    <div className="header-nav">
                        <ul className="header-nav-list">
                            <li className="header-nav-item" id="preview-nav-dashboard" >
                                <a
                                    className="header-nav-link active"
                                    href="https://osu.ppy.sh/"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    <span className="fake-bold">dashboard</span>
                                </a>
                            </li>
                            <li className="header-nav-item" id="preview-nav-friends" >
                                <a
                                    className="header-nav-link"
                                    href="https://osu.ppy.sh/home/friends"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    friends
                                </a>
                            </li>
                            <li className="header-nav-item" id="preview-nav-watchlists" >
                                <a
                                    className="header-nav-link"
                                    href="https://osu.ppy.sh/home/follows/forum_topic"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    watchlists
                                </a>
                            </li>
                            <li className="header-nav-item" id="preview-nav-account-settings" >
                                <a
                                    className="header-nav-link"
                                    href="https://osu.ppy.sh/home/account/edit"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    account settings
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="banner-section">
                        <div className="banner-blur"></div>
                        {safeBannerUrl ? (
                            <img src={safeBannerUrl} alt="banner" className="banner-image" />
                        ) : (
                            <div
                                className="banner-image"
                                style={{ background: "var(--mantine-color-default)" }}
                                aria-hidden
                            />
                        )}
                    </div>
                    <div className="content-section"></div>
                </Stack>
            </Card>
        </ScrollArea>
    );
}
