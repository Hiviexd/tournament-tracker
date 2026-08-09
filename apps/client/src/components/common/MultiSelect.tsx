import { MultiSelect as MantineMultiSelect } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { ComponentPropsWithRef } from "react";

type MultiSelectProps = ComponentPropsWithRef<typeof MantineMultiSelect>;

/**
 * Wrapper for Mantine's MultiSelect component that closes the dropdown when the value changes.
 */
export default function MultiSelect({ onChange, ...props }: MultiSelectProps) {
    const [dropdownOpened, { open, close }] = useDisclosure(false);

    return (
        <MantineMultiSelect
            {...props}
            dropdownOpened={dropdownOpened}
            onDropdownOpen={open}
            onDropdownClose={close}
            onChange={(value) => {
                onChange?.(value);
                close();
            }}
        />
    );
}
