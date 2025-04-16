import { useState, useEffect } from "react";

/**
 * Hook to manage local preferences in localStorage
 * @param key - The key to store the preference under in localStorage
 * @param defaultValue - The default value if no preference is found
 * @returns [value, setValue] - The current value and a function to update it
 */
export function useLocalPreference<T>(key: string, defaultValue: T): [T, (value: T) => void] {
    // Initialize state from localStorage or default value
    const [value, setValue] = useState(() => {
        try {
            const savedValue = localStorage.getItem(key);
            return savedValue ? JSON.parse(savedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    });

    // Save to localStorage whenever the value changes
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }, [key, value]);

    return [value, setValue];
}

/**
 * Utility function to get a saved preference without using the hook
 * @param key - The key to retrieve from localStorage
 * @param defaultValue - The default value if no preference is found
 */
export function getSavedPreference<T>(key: string, defaultValue: T): T {
    try {
        const savedValue = localStorage.getItem(key);
        return savedValue ? JSON.parse(savedValue) : defaultValue;
    } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
        return defaultValue;
    }
}

/**
 * Utility function to clear a saved preference
 * @param key - The key to remove from localStorage
 */
export function clearSavedPreference(key: string): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Error clearing ${key} from localStorage:`, error);
    }
}
