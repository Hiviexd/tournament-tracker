import express from "express";
import UsersController from "../controllers/UsersController";
import permissions from "../middlewares/permissions";

const usersRouter = express.Router();

usersRouter.get("/me", permissions.isLoggedIn, UsersController.getSelf);
usersRouter.get("/getCommittee", UsersController.getCommittee);
usersRouter.get("/:userInput", UsersController.getUser);

export default usersRouter;