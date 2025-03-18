import { Card } from "@mantine/core";
import { IUser } from "../../../interfaces/User";
import UserDisplay from "./UserDisplay";

interface IProps {
    user: IUser;
    onSelect: (user: IUser) => void;
    static?: boolean;
}

export default function UserCard({ user, onSelect, static: isStatic = false }: IProps) {
    return (
        <Card
            key={user._id}
            shadow="sm"
            p="md"
            bg="primary.10"
            className={isStatic ? "user-card user-card-static" : "user-card"}
            style={{ minWidth: 240 }}
            onClick={() => onSelect(user)}>
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url(${user.coverUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.4)",
                    zIndex: 0,
                }}
            />
            <div className="user-card-tint" />
            <div className="user-card-content">
                <UserDisplay user={user} />
            </div>
        </Card>
    );
}
