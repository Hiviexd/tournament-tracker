import User from "../models/userModel";

class UsersController {
    /** GET logged in user */
    public getSelf(_, res): void {
        const user = res.locals.user;
        res.json(user);
    }

    /** GET a user */
    public async getUser(req, res): Promise<void> {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput).orFail();

        res.json(user);
    }

    /** GET users in a committee */
    public async getCommittee(req, res): Promise<void> {
        const type = req.query.type;
        let query;

        switch (type) {
            case "tc":
                query = { groups: "tc" };
                break;
            case "cc":
                query = { groups: "cc" };
                break;
            default:
                query = { groups: { $in: ["tc", "cc"] } };
        }

        const committee = await User.find(query).orFail();

        res.json(committee);
    }
}

export default new UsersController();
