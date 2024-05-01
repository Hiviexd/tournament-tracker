import User from "../models/user";

class UsersController {
    public index(req, res): Promise<Response> {
        return res.json({ message: 'Hello World' });
    }

    public async getUser(req, res): Promise<Response> {
        const userInput = req.params.userInput;

        const user = await User.findByUsernameOrOsuId(userInput).orFail();

        return res.json(user);
    }
}

export default new UsersController();