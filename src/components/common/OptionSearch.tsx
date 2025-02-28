import { useState } from "react";
import { Combobox, InputBase, Text, useCombobox, Stack, Group } from "@mantine/core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
    options: string[];
    onOptionAdd: (option: string) => void;
    label?: string;
    placeholder?: string;
    error?: React.ReactNode;
    disabled?: boolean;
}

export default function OptionSearch({
    options,
    onOptionAdd,
    label,
    placeholder = "Search or type custom option...",
    error,
    disabled = false,
}: IProps) {
    const [search, setSearch] = useState("");
    const combobox = useCombobox();

    const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));

    const handleOptionSubmit = (value: string) => {
        onOptionAdd(value);
        setSearch("");
        combobox.closeDropdown();
    };

    return (
        <Stack gap={2}>
            {label && (
                <Text size="sm" fw={500}>
                    {label}
                </Text>
            )}

            <Combobox store={combobox} onOptionSubmit={handleOptionSubmit}>
                <Combobox.Target>
                    <InputBase
                        placeholder={placeholder}
                        value={search}
                        onChange={(e) => setSearch(e.currentTarget.value)}
                        onClick={() => !disabled && combobox.openDropdown()}
                        onFocus={() => !disabled && combobox.openDropdown()}
                        error={error}
                        disabled={disabled}
                        rightSection={<Combobox.Chevron />}
                    />
                </Combobox.Target>

                <Combobox.Dropdown>
                    <Combobox.Options style={{ maxHeight: 200, overflowY: "auto" }}>
                        {filteredOptions.map((option) => (
                            <Combobox.Option value={option} key={option}>
                                {option}
                            </Combobox.Option>
                        ))}
                        {search.trim() && !filteredOptions.includes(search.trim()) && (
                            <Combobox.Option value={search.trim()}>
                                <Group>
                                    <FontAwesomeIcon icon="plus" />
                                    Create "{search.trim()}"
                                </Group>
                            </Combobox.Option>
                        )}
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </Stack>
    );
}
