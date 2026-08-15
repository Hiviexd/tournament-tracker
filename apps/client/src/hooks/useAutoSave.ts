import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { isFunction } from "@tc/utils/client";

interface UseAutoSaveOptions<T = string> {
    key: string;
    initialValue?: T;
    debounceMs?: number;
    onSave?: (value: T) => void;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
}

// Utility function to clear any autosaved value by key
export function clearAutoSavedValue(key: string): void {
    if (key) {
        localStorage.removeItem(key);
    }
}

export function useAutoSave<T = string>({
    key,
    initialValue,
    debounceMs = 500,
    serialize = (value: T) => String(value),
    deserialize = (value: string): T => {
        // SAFETY: default deserialize is identity; callers with a non-string T pass their own deserialize.
        return value as T;
    },
}: UseAutoSaveOptions<T> & { initialValue: T }) {
    // Try to get saved value from localStorage, fallback to initialValue
    const [value, setValueInternal] = useState<T>(() => {
        try {
            const saved = localStorage.getItem(key);
            return saved ? deserialize(saved) : initialValue;
        } catch (error) {
            console.warn(`Failed to deserialize autosaved value for key "${key}":`, error);
            return initialValue;
        }
    });
    const [state, setState] = useState({ isSaved: false, isTyping: false });

    // Track the last saved value to prevent unnecessary saves
    const lastSavedValueRef = useRef<string | null>(null);

    const [debouncedValue] = useDebouncedValue(value, debounceMs);

    const serializedDebouncedValue = useMemo(() => serialize(debouncedValue), [debouncedValue, serialize]);

    // Custom setValue that handles state transitions directly
    const setValue = useCallback(
        (newValue: T | ((prev: T) => T)) => {
            let resolvedValue: T;
            if (isFunction(newValue)) {
                // SAFETY: React setState updaters are (prev: T) => T; isFunction only types a generic function.
                resolvedValue = (newValue as (prev: T) => T)(value);
            } else {
                resolvedValue = newValue;
            }
            setValueInternal(resolvedValue);

            // If value changes and it's different from the last saved value, user is typing
            const serializedValue = serialize(resolvedValue);
            if (serializedValue !== lastSavedValueRef.current) {
                setState({ isSaved: false, isTyping: true });
            }
        },
        [value, serialize],
    );

    // Save to localStorage when debounced value changes
    useEffect(() => {
        // Only skip if the value is exactly the same as last saved
        if (serializedDebouncedValue === lastSavedValueRef.current) {
            return;
        }

        // Save to localStorage
        localStorage.setItem(key, serializedDebouncedValue);
        lastSavedValueRef.current = serializedDebouncedValue;

        // Show saved indicator and mark that we're no longer typing
        setState({ isSaved: true, isTyping: false });
    }, [serializedDebouncedValue, key]);

    // Clear saved value
    const clear = useCallback(() => {
        setValueInternal(initialValue);
        clearAutoSavedValue(key);
        setState({ isSaved: false, isTyping: false });
        lastSavedValueRef.current = null;
    }, [key, initialValue]);

    return {
        value,
        setValue,
        clear,
        isSaved: state.isSaved,
        isTyping: state.isTyping,
    };
}
