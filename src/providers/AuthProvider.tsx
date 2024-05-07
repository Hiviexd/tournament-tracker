import { useEffect } from "react";
import { loggedInUserAtom, initializedAtom } from "../atoms/userAtoms";
import { useAtom } from "jotai";

export default function AuthProvider({ children }) {
    const [, setUser] = useAtom(loggedInUserAtom);
    const [, setInitialized] = useAtom(initializedAtom);

    useEffect(() => {
        async function fetchUser () {
            try {
                setInitialized(false);
                const response = await window.$http.executeGet("/users/me");

                if (window.$http.isValid(response)) setUser(response);
            } catch (error) {
                console.error(error);
            } finally {
                setInitialized(true);
            }
        }

        fetchUser();
    }, [setUser, setInitialized]);

    return <>{children}</>;
}
