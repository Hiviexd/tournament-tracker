import { useState, useEffect } from "react";
import { useDebouncedValue } from "@mantine/hooks";

interface UseAutoSaveOptions {
    key: string;
    initialValue?: string;
    debounceMs?: number;
    onSave?: (value: string) => void;
}

export function useAutoSave({ key, initialValue = "", debounceMs = 1000, onSave }: UseAutoSaveOptions) {
    // Try to get saved value from localStorage, fallback to initialValue
    const [value, setValue] = useState(() => {
        const saved = localStorage.getItem(key);
        return saved ?? initialValue;
    });
    const [isSaved, setIsSaved] = useState(false);

    const [debouncedValue] = useDebouncedValue(value, debounceMs);

    // Save to localStorage when value changes
    useEffect(() => {
        if (debouncedValue) {
            localStorage.setItem(key, debouncedValue);
            onSave?.(debouncedValue);
            setIsSaved(true);

            const timeout = setTimeout(() => setIsSaved(false), 1000);
            return () => clearTimeout(timeout);
        } else {
            localStorage.removeItem(key);
        }
    }, [debouncedValue, key, onSave]);

    // Clear saved value
    const clear = () => {
        setValue("");
        localStorage.removeItem(key);
        setIsSaved(false);
    };

    return {
        value,
        setValue,
        clear,
        isSaved,
    };
}
