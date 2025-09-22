import { useState, useEffect, useRef, useCallback } from "react";
import { useDebouncedValue } from "@mantine/hooks";

interface UseAutoSaveOptions {
    key: string;
    initialValue?: string;
    debounceMs?: number;
    onSave?: (value: string) => void;
}

// Utility function to clear any autosaved value by key
export function clearAutoSavedValue(key: string): void {
    if (key) {
        localStorage.removeItem(key);
    }
}

export function useAutoSave({ key, initialValue = "", debounceMs = 500 }: UseAutoSaveOptions) {
    // Try to get saved value from localStorage, fallback to initialValue
    const [value, setValueInternal] = useState(() => {
        const saved = localStorage.getItem(key);
        return saved ?? initialValue;
    });
    const [state, setState] = useState({ isSaved: false, isTyping: false });

    // Track the last saved value to prevent unnecessary saves
    const lastSavedValueRef = useRef<string | null>(null);

    const [debouncedValue] = useDebouncedValue(value, debounceMs);

    // Custom setValue that handles state transitions directly
    const setValue = useCallback(
        (newValue: string | ((prev: string) => string)) => {
            const resolvedValue = typeof newValue === "function" ? newValue(value) : newValue;
            setValueInternal(resolvedValue);

            // If value changes and it's different from the last saved value, user is typing
            if (resolvedValue !== lastSavedValueRef.current) {
                setState({ isSaved: false, isTyping: true });
            }
        },
        [value]
    );

    // Save to localStorage when debounced value changes
    useEffect(() => {
        // Only skip if the value is exactly the same as last saved
        if (debouncedValue === lastSavedValueRef.current) {
            return;
        }

        // Save to localStorage
        localStorage.setItem(key, debouncedValue);
        lastSavedValueRef.current = debouncedValue;

        // Show saved indicator and mark that we're no longer typing
        setState({ isSaved: true, isTyping: false });
    }, [debouncedValue, key]);

    // Clear saved value
    const clear = useCallback(() => {
        setValueInternal("");
        clearAutoSavedValue(key);
        setState({ isSaved: false, isTyping: false });
        lastSavedValueRef.current = null;
    }, [key]);

    return {
        value,
        setValue,
        clear,
        isSaved: state.isSaved,
        isTyping: state.isTyping,
    };
}
