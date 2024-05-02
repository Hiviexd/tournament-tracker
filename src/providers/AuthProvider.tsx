import { useEffect } from "react";
import { loggedInUser, loggedInUserLoaded } from "../atoms/userAtoms";
import { useSetRecoilState } from "recoil";

export default function AuthProvider({ children }) {
    const setUser = useSetRecoilState(loggedInUser);
    const setUserLoaded = useSetRecoilState(loggedInUserLoaded);

    useEffect(() => {
        async function fetchUser () {
            try {
                setUserLoaded(false);
                const response = await window.$http.executeGet("/users/me");

                if (window.$http.isValid(response)) setUser(response);
            } catch (error) {
                console.error(error);
            } finally {
                setUserLoaded(true);
            }
        }

        fetchUser();
    }, [setUser, setUserLoaded]);

    return <>{children}</>;
}
