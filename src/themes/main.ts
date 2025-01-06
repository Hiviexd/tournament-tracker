import { createTheme, MantineColorsTuple } from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";
import helpers from "../helpers";

const danger: MantineColorsTuple = [
    "#ffeaec",
    "#fdd4d6",
    "#f4a7ac",
    "#ec777e",
    "#e64f57",
    "#e3353f",
    "#e22732",
    "#c91a25",
    "#b31220",
    "#9e0419",
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

const hue = parseInt(localStorage.getItem("hue") || "40", 10);
const isGreyscale = localStorage.getItem("greyscale") === "true";

const generateTheme = (hue: number, isGreyscale: boolean) => {
    const primaryHexColor = isGreyscale ? "#000000" : helpers.hslToHex(hue, 0.8, 0.5);

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
        Tooltip: {
            defaultProps: {
                withArrow: true,
                color: "secondary",
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
    },
});
