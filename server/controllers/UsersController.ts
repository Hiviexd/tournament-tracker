import User from "../models/user";
import { UserGroup } from "../../interfaces/user";

class UsersController {
    public async getSelf(req, res): Promise<Response> {
        const user = await User.findById(req.session.mongoId).orFail();

        return res.json(user);
    }

    public async getUser(req, res): Promise<Response> {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput).orFail();

        return res.json(user);
    }

    public async getCommittee(req, res): Promise<Response> {
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

        return res.json(committee);
    }
}

export default new UsersController();
