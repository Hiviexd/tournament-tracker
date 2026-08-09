import { useState, useEffect, useRef } from "react";

interface UseImageLoadOptions {
    onLoad?: () => void;
    onError?: (error: Event) => void;
}

interface UseImageLoadReturn {
    loading: boolean;
    error: boolean;
    success: boolean;
    retry: () => void;
}

/**
 * Hook to load an image and track its loading state
 * @warn This hook is stupid and should avoid using it on anything that's prone to regular state changes because of flickering
 * @param src - The source URL of the image
 * @param options - Optional parameters
 * @param options.onLoad - Callback function to be called when the image loads successfully
 * @param options.onError - Callback function to be called when the image fails to load
 * @returns An object containing the loading state, error state, success state, and a retry function
 */
export function useImageLoad(src: string | undefined, options: UseImageLoadOptions = {}): UseImageLoadReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);

    // Use ref to track the current image object for cleanup
    const imageRef = useRef<HTMLImageElement | null>(null);
    const { onLoad, onError } = options;

    const loadImage = () => {
        if (!src) {
            setLoading(false);
            setError(false);
            setSuccess(false);
            return;
        }

        setLoading(true);
        setError(false);
        setSuccess(false);

        // Clean up previous image if it exists
        if (imageRef.current) {
            imageRef.current.onload = null;
            imageRef.current.onerror = null;
        }

        const img = new Image();
        imageRef.current = img;

        img.onload = () => {
            if (imageRef.current === img) {
                setLoading(false);
                setSuccess(true);
                setError(false);
                onLoad?.();
            }
        };

        img.onerror = (event) => {
            if (imageRef.current === img) {
                setLoading(false);
                setSuccess(false);
                setError(true);
                onError?.(event as Event);
            }
        };

        img.src = src;
    };

    // Load image when src changes
    useEffect(() => {
        loadImage();

        // Cleanup
        return () => {
            if (imageRef.current) {
                imageRef.current.onload = null;
                imageRef.current.onerror = null;
                imageRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]);

    // Retry function to reload the image
    const retry = () => {
        loadImage();
    };

    return {
        loading,
        error,
        success,
        retry,
    };
}
