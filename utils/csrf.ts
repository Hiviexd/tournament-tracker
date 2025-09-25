import axios from "axios";
import { getDefaultStore } from "jotai";
import { csrfTokenAtom, csrfLoadingAtom, csrfErrorAtom } from "../src/store/atoms";

// Get the default Jotai store for use outside React components
const store = getDefaultStore();

// Track interceptor state
let isInitialized = false;

/**
 * Fetches a new CSRF token from the server
 */
async function fetchCsrfToken(): Promise<string | null> {
    try {
        store.set(csrfLoadingAtom, true);
        store.set(csrfErrorAtom, null);

        const response = await axios.get("/api/auth/csrf");
        const token = response.data?.token || null;

        store.set(csrfTokenAtom, token);
        store.set(csrfLoadingAtom, false);

        return token;
    } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Failed to fetch CSRF token";
        store.set(csrfErrorAtom, errorMessage);
        store.set(csrfTokenAtom, null);
        store.set(csrfLoadingAtom, false);
        console.log("CSRF token fetch error:", errorMessage);
        return null;
    }
}

/**
 * Ensures the CSRF interceptor is attached to axios
 * This automatically adds CSRF tokens to unsafe requests and handles token refresh
 */
export function ensureCsrfInterceptor() {
    if (isInitialized) return;
    isInitialized = true;

    // Request interceptor - adds CSRF tokens to unsafe requests
    axios.interceptors.request.use(
        async (config) => {
            const method = (config.method || "get").toLowerCase();
            const unsafe = ["post", "put", "patch", "delete"].includes(method);

            if (unsafe) {
                // Get the current CSRF token from Jotai store
                let csrfToken = store.get(csrfTokenAtom);

                // If no token exists, try to fetch one
                if (!csrfToken && !store.get(csrfLoadingAtom)) {
                    csrfToken = await fetchCsrfToken();
                }

                if (csrfToken) {
                    config.headers = config.headers || {};
                    (config.headers as any)["X-CSRF-Token"] = csrfToken;
                }
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor - handles CSRF token errors
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Handle CSRF token errors
            if (
                error.response?.status === 403 &&
                error.response?.data?.error?.includes("CSRF") &&
                !originalRequest._retry
            ) {
                originalRequest._retry = true;

                // Try to fetch a new CSRF token
                const newToken = await fetchCsrfToken();

                if (newToken) {
                    // Retry the original request with the new token
                    originalRequest.headers = originalRequest.headers || {};
                    (originalRequest.headers as any)["X-CSRF-Token"] = newToken;
                    return axios(originalRequest);
                }
            }

            return Promise.reject(error);
        }
    );
}
