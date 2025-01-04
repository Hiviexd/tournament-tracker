import express from "express";
import UsersController from "../controllers/UsersController";
import permissions from "../middlewares/permissions";

const usersRouter = express.Router();

usersRouter.get("/", permissions.isLoggedIn, permissions.isCommittee, UsersController.index);
usersRouter.get("/me", permissions.isLoggedIn, UsersController.getSelf);
usersRouter.get("/getCommittee", UsersController.getCommittee);
usersRouter.post("/create", permissions.isLoggedIn, permissions.isCommittee, UsersController.create);
usersRouter.get("/:userInput", UsersController.getUser);

export default usersRouter;