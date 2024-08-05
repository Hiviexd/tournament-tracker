import { createTheme, MantineColorsTuple } from "@mantine/core";

const primary: MantineColorsTuple = [
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
];

const secondary: MantineColorsTuple = [
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

export const theme = createTheme({
    fontFamily: "Torus, sans-serif",
    shadows: {
        md: "1px 1px 3px rgba(0, 0, 0, .25)",
        xl: "5px 5px 3px rgba(0, 0, 0, .25)",
    },
    colors: {
        primary,
        secondary,
        danger,
        info,
        success,
        warning,
    },
    primaryColor: "primary",
    white: "#f8f9fa",
    black: "#212529",
});
