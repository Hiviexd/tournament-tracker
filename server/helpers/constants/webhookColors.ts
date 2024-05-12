
function parseColor(color: string): number {
    return parseInt(color.substring(1), 16);
}

/* eslint-disable key-spacing */
const webhookColors = {
    darkRed:     parseColor("#861615"),
    red:         parseColor("#EE2629"),
    lightRed:    parseColor("#ff5050"),

    darkOrange:  parseColor("#CE5310"),
    orange:      parseColor("#f57e2a"),
    lightOrange: parseColor("#EEA578"),

    darkYellow:  parseColor("#ffac00"),
    yellow:      parseColor("#ffc85a"),
    lightYellow: parseColor("#FFFF55"),

    darkGreen:   parseColor("#22A522"),
    green:       parseColor("#42D63E"),
    lightGreen:  parseColor("#1df27d"),

    darkBlue:    parseColor("#304989"),
    blue:        parseColor("#008cff"),
    lightBlue:   parseColor("#83E3FF"),

    darkPurple:  parseColor("#721C6F"),
    purple:      parseColor("#8240A8"),
    lightPurple: parseColor("#AA7FF1"),

    darkPink:    parseColor("#FF40A8"),
    pink:        parseColor("#FF8ECC"),
    lightPink:   parseColor("#FFB3C4"),

    white:       parseColor("#EFEFEF"),
    brown:       parseColor("#91582A"),
    gray:        parseColor("#9E9E9E"),
    black:       parseColor("#272727"),
};

export default webhookColors;
