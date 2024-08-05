import { useAtom } from "jotai";
import { loggedInUserAtom } from "../store/atoms";
import { Link } from "react-router-dom";

export default function AdminPage() {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <div>
            <p>{user?.username} is an admin, spooky...</p>

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
