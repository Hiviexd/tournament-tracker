import { createTheme, MantineColorsTuple } from "@mantine/core";
import { generateColors } from "@mantine/colors-generator";
import helpers from "../helpers";

enum ColorType {
    PRIMARY = "primary-color",
    SECONDARY = "secondary-color",
}

const getStoredColors = (type: ColorType): MantineColorsTuple | null => {
    const stored = localStorage.getItem(type);
    return stored ? JSON.parse(stored) : null;
};

const setStoredColors = (type: ColorType, hue: number, color: MantineColorsTuple) => {
    localStorage.setItem(type, JSON.stringify(color));
    localStorage.setItem(`${type}-hue`, hue.toString());
};

/**
 * Old purple theme
 */
/*const primary: MantineColorsTuple = [
    "#faedff",
    "#edd9f7",
    "#d8b1ea",
    "#c286dd",
    "#ae62d2",
    "#a24bcb",
    "#9e3fc9",
    "#8931b2",
    "#7b2aa0",
    "#6b218d",
    "#24222a",
    "#18171c",
];*/

/*const secondary: MantineColorsTuple = [
    "#f4f4f6",
    "#e6e6e6",
    "#cac9cc",
    "#adabb2",
    "#94919c",
    "#84808f",
    "#7d788a",
    "#6b6777",
    "#5f5b6b",
    "#524e60",
];*/

/**
 * Current yellow theme
 */
// Not auto-generated
const defaultPrimary: MantineColorsTuple = [
    helpers.hslToHex(45, 0.6, 0.95),    // Previously #fff9e5 - hsl(45, 100%, 95%)
    helpers.hslToHex(45, 0.6, 0.90),    // Previously #fff2cc - hsl(45, 100%, 90%)
    helpers.hslToHex(45, 0.6, 0.80),    // Previously #ffe59a - hsl(45, 100%, 80%)
    helpers.hslToHex(45, 0.6, 0.70),    // Previously #ffd966 - hsl(45, 100%, 70%)
    helpers.hslToHex(45, 0.6, 0.60),    // Previously #ffcc33 - hsl(45, 100%, 60%)
    helpers.hslToHex(45, 0.6, 0.55),    // Previously #ffc61a - hsl(45, 100%, 55%)
    helpers.hslToHex(45, 0.6, 0.50),    // Previously #ffbf00 - hsl(45, 100%, 50%)
    helpers.hslToHex(45, 0.6, 0.45),    // Previously #e6ac00 - hsl(45, 100%, 45%)
    helpers.hslToHex(45, 0.6, 0.40),    // Previously #cc9900 - hsl(45, 100%, 40%)
    helpers.hslToHex(45, 1, 0.35),    // Previously #b38600 - hsl(45, 100%, 35%)
    helpers.hslToHex(45, 0.1, 0.15),    // Previously #2a2822 - hsl(45, 10%, 15%)
    helpers.hslToHex(45, 0.1, 0.10),    // Previously #1c1b17 - hsl(45, 10%, 10%)
];

// Not auto-generated
const defaultSecondary: MantineColorsTuple = [
    helpers.hslToHex(45, 0.3, 0.95),    // Previously #f6f4ee - hsl(45, 30%, 95%)
    helpers.hslToHex(45, 0.3, 0.90),    // Previously #ede9de - hsl(45, 30%, 90%)
    helpers.hslToHex(45, 0.3, 0.80),    // Previously #dbd4bd - hsl(45, 30%, 80%)
    helpers.hslToHex(45, 0.3, 0.70),    // Previously #c9be9c - hsl(45, 30%, 70%)
    helpers.hslToHex(45, 0.3, 0.60),    // Previously #b8a87a - hsl(45, 30%, 60%)
    helpers.hslToHex(45, 0.3, 0.55),    // Previously #af9d6a - hsl(45, 30%, 55%)
    helpers.hslToHex(45, 0.3, 0.50),    // Previously #a69359 - hsl(45, 30%, 50%)
    helpers.hslToHex(45, 0.3, 0.45),    // Previously #958450 - hsl(45, 30%, 45%)
    helpers.hslToHex(45, 0.3, 0.40),    // Previously #857547 - hsl(45, 30%, 40%)
    helpers.hslToHex(45, 0.3, 0.35),    // Previously #74673e - hsl(45, 30%, 35%)
];

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

export const updateHue = (hue: number, isGreyscale: boolean) => {
    const primaryHexColor = isGreyscale ? "#000000" : helpers.hslToHex(hue, 0.7, 0.5);

    // handle primary color
    const primaryColors = generateColors(primaryHexColor) as unknown as string[];

    // append the hsl(X, 10%, 15%) and hsl(X, 10%, 10%) versions manually
    const dark = isGreyscale ? "#262626" : helpers.hslToHex(hue, 0.1, 0.15);
    const darker = isGreyscale ? "#1a1a1a" : helpers.hslToHex(hue, 0.1, 0.1);
    primaryColors.push(dark);
    primaryColors.push(darker);

    // handle secondary color
    const secondaryHexColor = isGreyscale ? "#ffffff" : helpers.hslToHex(hue, 0.3, 0.5);
    const secondaryColors = generateColors(secondaryHexColor) as unknown as string[];

    setStoredColors(ColorType.PRIMARY, hue, primaryColors as unknown as MantineColorsTuple);
    setStoredColors(ColorType.SECONDARY, hue, secondaryColors as unknown as MantineColorsTuple);
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
        primary: getStoredColors(ColorType.PRIMARY) || defaultPrimary,
        secondary: getStoredColors(ColorType.SECONDARY) || defaultSecondary,
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
