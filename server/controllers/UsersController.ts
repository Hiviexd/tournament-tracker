import User from "../models/user";
import { UserGroup } from "../../interfaces/user";

class UsersController {
    public getSelf(_, res): void {
        const user = res.locals.user;
        res.json(user);
    }

    public async getUser(req, res): Promise<void> {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput).orFail();

        res.json(user);
    }

    public async getCommittee(req, res): Promise<void> {
        const type = req.query.type;
        let query;

        switch (type) {
            case UserGroup.Tournaments:
                query = { groups: UserGroup.Tournaments };
                break;
            case UserGroup.Contests:
                query = { groups: UserGroup.Contests };
                break;
            default:
                query = { groups: { $in: [UserGroup.Tournaments, UserGroup.Contests] } };
        }

        const committee = await User.find(query).orFail();

        res.json(committee);
    }
}

export default new UsersController();
