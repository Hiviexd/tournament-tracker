import { useAtom } from "jotai";
import { loggedInUserAtom } from "../atoms/userAtoms";
import { Link } from "react-router-dom";

export default function CommitteePage() {
    const [user] = useAtom(loggedInUserAtom);

    return (
        <div>
            <h1>Committee</h1>
            <p>{user?.username} is a member of the {user?.isTournamentCommittee ? "tournament" : "contest"} committee!</p>

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
