import { createTheme, MantineColorsTuple } from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";
import helpers from "../helpers";
import { DEFAULT_HUE } from "../constants";

const danger: MantineColorsTuple = [
    "#ffe8e9",
    "#ffd1d1",
    "#fba0a0",
    "#f76d6d",
    "#f44141",
    "#f22625",
    "#f21616",
    "#d8070b",
    "#c10007",
    "#a90003",
];

const info: MantineColorsTuple = [
    "#e0fbff",
    "#cbf2ff",
    "#9ae2ff",
    "#64d2ff",
    "#3cc5fe",
    "#23bcfe",
    "#09b8ff",
    "#00a1e4",
    "#0090cd",
    "#007cb5",
];

const success: MantineColorsTuple = [
    "#e5feee",
    "#d2f9e0",
    "#a8f1c0",
    "#7aea9f",
    "#53e383",
    "#3bdf70",
    "#2bdd66",
    "#1ac455",
    "#0caf49",
    "#00963c",
];

const warning: MantineColorsTuple = [
    "#fff8e1",
    "#ffefcc",
    "#ffdd9b",
    "#ffca64",
    "#ffba38",
    "#ffb01b",
    "#ffab09",
    "#e39500",
    "#ca8500",
    "#af7100",
];

const hue = parseInt(localStorage.getItem("hue") || DEFAULT_HUE, 10);
const isGreyscale = localStorage.getItem("greyscale") === "true";

const generateTheme = (hue: number, isGreyscale: boolean) => {
    const primaryHexColor = isGreyscale ? "#000000" : helpers.hslToHex(hue, 0.5, 0.5);

    const theme = generateColors(primaryHexColor) as unknown as string[];

    // append the hsl(X, 10%, 15%) and hsl(X, 10%, 10%) versions manually
    const dark = isGreyscale ? "#262626" : helpers.hslToHex(hue, 0.1, 0.15);
    const darker = isGreyscale ? "#1a1a1a" : helpers.hslToHex(hue, 0.1, 0.1);
    theme.push(dark);
    theme.push(darker);

    return theme as unknown as MantineColorsTuple;
};

export const updateTheme = (hue: number, isGreyscale: boolean) => {
    localStorage.setItem("hue", hue.toString());
    localStorage.setItem("greyscale", isGreyscale ? "true" : "false");

    window.location.reload();
};

export const theme = createTheme({
    fontFamily: "Nunito, sans-serif",
    shadows: {
        md: "1px 1px 3px rgba(0, 0, 0, .25)",
        xl: "5px 5px 3px rgba(0, 0, 0, .25)",
    },
    colors: {
        primary: generateTheme(hue, isGreyscale),
        danger,
        info,
        success,
        warning,
    },
    primaryColor: "primary",
    white: "#f8f9fa",
    black: "#212529",
    components: {
        Anchor: {
            styles: (theme) => ({
                root: {
                    color: isGreyscale ? theme.colors.info[4] : theme.colors.primary[3],
                    "&:hover": {
                        textDecoration: "underline",
                    },
                    "&.whiteLink": {
                        color: theme.white,
                    },
                },
            }),
        },
        Tooltip: {
            defaultProps: {
                withArrow: true,
                color: "primary.11",
            },
            styles: {
                tooltip: {
                    border: "1px solid var(--mantine-color-primary-6)",
                    boxShadow: "0 4px 4px rgba(0, 0, 0, 0.1)",
                    filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))",
                },
                arrow: {
                    border: "1px solid var(--mantine-color-primary-6)",
                    filter: "drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1))",
                },
            },
        },
        Button: {
            styles: {
                root: {
                    transition: "all 0.2s ease",
                    "&:hover": {
                        transform: "translateY(-2px)",
                    },
                },
            },
        },
        ActionIcon: {
            styles: {
                root: {
                    transition: "all 0.2s ease",
                    "&:hover": {
                        transform: "translateY(-2px)",
                    },
                },
            },
        },
        Card: {
            defaultProps: {
                bg: "primary.11",
            },
            styles: {
                root: {
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                },
            },
        },
        Popover: {
            styles: {
                dropdown: {
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                },
            },
        },
    },
});
