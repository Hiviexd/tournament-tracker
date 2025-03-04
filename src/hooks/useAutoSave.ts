import { useState, useEffect, useRef } from "react";
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

export function useAutoSave({ key, initialValue = "", debounceMs = 500, onSave }: UseAutoSaveOptions) {
    // Try to get saved value from localStorage, fallback to initialValue
    const [value, setValue] = useState(() => {
        const saved = localStorage.getItem(key);
        return saved ?? initialValue;
    });
    const [isSaved, setIsSaved] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    // Track the last saved value to prevent unnecessary saves
    const lastSavedValueRef = useRef<string | null>(null);

    const [debouncedValue] = useDebouncedValue(value, debounceMs);

    // Detect when user is typing (value changes)
    useEffect(() => {
        // If value changes and it's different from the last saved value, user is typing
        if (value !== lastSavedValueRef.current) {
            setIsTyping(true);
            // Hide the saved indicator while typing
            setIsSaved(false);
        }
    }, [value]);

    // Save to localStorage when debounced value changes
    useEffect(() => {
        // Skip empty values or values that are exactly the same as last saved
        if (!debouncedValue || debouncedValue === lastSavedValueRef.current) {
            return;
        }

        // Save to localStorage
        localStorage.setItem(key, debouncedValue);
        lastSavedValueRef.current = debouncedValue;

        // Call onSave callback if provided
        onSave?.(debouncedValue);

        // Show saved indicator and mark that we're no longer typing
        setIsSaved(true);
        setIsTyping(false);
    }, [debouncedValue, key, onSave]);

    // Clear saved value
    const clear = () => {
        setValue("");
        clearAutoSavedValue(key);
        setIsSaved(false);
        setIsTyping(false);
        lastSavedValueRef.current = null;
    };

    return {
        value,
        setValue,
        clear,
        isSaved,
        isTyping,
    };
}
