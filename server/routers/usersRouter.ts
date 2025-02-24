import express from "express";
import UsersController from "../controllers/UsersController";
import permissions from "../middlewares/permissions";

const usersRouter = express.Router();

usersRouter.get("/", permissions.isLoggedIn, UsersController.index);
usersRouter.get("/me", permissions.isLoggedIn, UsersController.getSelf);
usersRouter.get("/getCommittee", UsersController.getCommittee);
usersRouter.post("/create", permissions.isLoggedIn, permissions.isCommittee, UsersController.create);
usersRouter.get("/:userInput", UsersController.getUser);
usersRouter.post("/:userId/toggleReviewerStatus", permissions.isLoggedIn, permissions.isCommittee, UsersController.toggleReviewerStatus);
usersRouter.post("/:userId/groupMove", permissions.isLoggedIn, permissions.isAdmin, UsersController.updateUserGroups);
usersRouter.post("/:userId/updateBadge", permissions.isLoggedIn, permissions.isAdmin, UsersController.updateBadge);

export default usersRouter;
