import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { Link } from "react-router-dom";

export default function UserPage() {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <div>
            <p>if you ({user?.username}) can see this, it means you're logged in!</p>

            <Link to="/">Home Page</Link>
            <br />
            <Link to="/user">User Page</Link>
            <br />
            <Link to="/committee">Committee Page</Link>
            <br />
            <Link to="/admin">Admin Page</Link>

            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    );
}
