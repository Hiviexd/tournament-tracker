import { useRecoilValue } from "recoil";
import { loggedInUser } from "../atoms/userAtoms";
import { Link } from "react-router-dom";

export default function AdminPage() {
    const user = useRecoilValue(loggedInUser);

    return (
        <div>
            <h1>Admin</h1>
            <p>{user?.username} is an admin, spooky...</p>

            <Link to="/">Home Page</Link>
            <br />
            <Link to="/committee">Committee Page</Link>
            <br />
            <Link to="/admin">Admin Page</Link>

            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    );
}
