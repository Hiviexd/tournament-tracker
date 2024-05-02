import { useRecoilValue } from "recoil";
import { loggedInUser } from "../atoms/userAtoms";
import { Link } from "react-router-dom";

export default function HomePage() {
    const user = useRecoilValue(loggedInUser);

    return (
        <div>
            <h1>Home</h1>
            <p>{user ? <>Welcome back, {user?.username}!</> : "Hello, newcomer!"}</p>

            {user && <a href="/api/auth/logout">Logout</a>}
            <br />
            {!user && <a href="/api/auth/login">Login</a>}
            <br />
            <Link to="/">Home Page</Link>
            <br />
            <Link to="/committee">Committee Page</Link>
            <br />
            <Link to="/admin">Admin Page</Link>

            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    );
}
