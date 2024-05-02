import express from "express";
import UsersController from "../controllers/UsersController";

const usersRouter = express.Router();

usersRouter.get("/me", UsersController.getSelf);
usersRouter.get("/getCommittee", UsersController.getCommittee);
usersRouter.get("/:userInput", UsersController.getUser);

export default usersRouter;