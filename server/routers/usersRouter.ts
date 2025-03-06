// @ts-nocheck
import express from "express";
import UsersController from "../controllers/UsersController";
import auth from "../middlewares/auth";

const usersRouter = express.Router();

usersRouter.get("/", auth.isLoggedIn, UsersController.index);
usersRouter.get("/me", auth.isLoggedIn, UsersController.getSelf);
usersRouter.get("/getCommittee", UsersController.getCommittee);
usersRouter.post("/create", auth.isLoggedIn, UsersController.create);
usersRouter.get("/:userInput", UsersController.getUser);
usersRouter.post(
    "/:userId/toggleReviewerStatus",
    auth.isLoggedIn,
    auth.isCommittee,
    UsersController.toggleReviewerStatus
);
usersRouter.post("/:userId/groupMove", auth.isLoggedIn, auth.isAdmin, UsersController.updateUserGroups);
usersRouter.post("/:userId/updateBadge", auth.isLoggedIn, auth.isAdmin, UsersController.updateBadge);
usersRouter.post("/:userId/sync", auth.isLoggedIn, auth.isCommittee, UsersController.syncUser);
usersRouter.post("/:userId/updateDiscordId", auth.isLoggedIn, auth.isCommittee, UsersController.updateDiscordId);

export default usersRouter;
