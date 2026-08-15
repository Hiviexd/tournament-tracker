import { useMemo } from "react";
import * as countryFlags from "country-flag-icons/react/3x2";
import { Tooltip } from "@mantine/core";
import { IOsuCountry } from "@tc/types/OsuApi";

interface CountryFlagProps {
    country: IOsuCountry;
    showCountryName?: boolean;
}

export default function CountryFlag({ country, showCountryName = false }: CountryFlagProps) {
    const FlagComponent = useMemo(() => {
        // SAFETY: osu! country.code is an ISO alpha-2 string; country-flag-icons only types known pack keys, and missing flags already return null below.
        return countryFlags[country.code as keyof typeof countryFlags];
    }, [country.code]);

    if (!FlagComponent) {
        return null;
    }

    if (showCountryName) {
        return (
            <div className="user-country">
                <span className="country-flag">
                    <FlagComponent />
                </span>
                <span className="country-name">{country.name}</span>
            </div>
        );
    }

    return (
        <div className="user-country">
            <Tooltip label={country.name}>
                <span className="country-flag">
                    <FlagComponent />
                </span>
            </Tooltip>
        </div>
    );
}
