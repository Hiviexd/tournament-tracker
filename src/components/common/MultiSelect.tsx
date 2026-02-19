import { MultiSelect as MantineMultiSelect } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { forwardRef } from "react";
import type { ComponentPropsWithRef } from "react";

type MultiSelectProps = ComponentPropsWithRef<typeof MantineMultiSelect>;

/**
 * Wrapper for Mantine's MultiSelect component that closes the dropdown when the value changes.
 */
const MultiSelect = forwardRef<HTMLInputElement, MultiSelectProps>(function MultiSelect(
    { onChange, ...props },
    ref
) {
    const [dropdownOpened, { open, close }] = useDisclosure(false);

    return (
        <MantineMultiSelect
            ref={ref}
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
});

export default MultiSelect;
