import { useState, useEffect } from "react";

const MARKDOWN_MODE_KEY = "editor_markdown_mode";

/**
 * Hook to manage editor preferences in localStorage
 * Currently supports saving the markdown mode preference
 */
export function useEditorPreferences() {
    // Initialize state from localStorage or default to false
    const [isMarkdownMode, setIsMarkdownMode] = useState(() => {
        try {
            const savedValue = localStorage.getItem(MARKDOWN_MODE_KEY);
            return savedValue ? JSON.parse(savedValue) : false;
        } catch (error) {
            console.error("Error reading markdown mode from localStorage:", error);
            return false;
        }
    });

    // Save to localStorage whenever the value changes
    useEffect(() => {
        try {
            localStorage.setItem(MARKDOWN_MODE_KEY, JSON.stringify(isMarkdownMode));
        } catch (error) {
            console.error("Error saving markdown mode to localStorage:", error);
        }
    }, [isMarkdownMode]);

    // Toggle the markdown mode
    const toggleMarkdownMode = () => {
        setIsMarkdownMode((prev) => !prev);
    };

    return {
        isMarkdownMode,
        setIsMarkdownMode,
        toggleMarkdownMode,
    };
}

/**
 * Utility function to get the saved markdown mode preference
 * without using the hook (for initial state)
 */
export function getSavedMarkdownMode(): boolean {
    try {
        const savedValue = localStorage.getItem(MARKDOWN_MODE_KEY);
        return savedValue ? JSON.parse(savedValue) : false;
    } catch (error) {
        console.error("Error reading markdown mode from localStorage:", error);
        return false;
    }
}

/**
 * Utility function to clear the saved markdown mode preference
 */
export function clearSavedMarkdownMode(): void {
    try {
        localStorage.removeItem(MARKDOWN_MODE_KEY);
    } catch (error) {
        console.error("Error clearing markdown mode from localStorage:", error);
    }
}
