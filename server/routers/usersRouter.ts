// @ts-nocheck
import express from "express";
import UsersController from "../controllers/UsersController";
import auth from "../middlewares/auth";

const usersRouter = express.Router();

usersRouter.get("/", auth.isLoggedIn, UsersController.index);
usersRouter.get("/me", auth.isLoggedIn, UsersController.getSelf);
usersRouter.get("/getCommittee", auth.optionalAuth, UsersController.getCommittee);
usersRouter.post("/create", auth.isLoggedIn, UsersController.create);
usersRouter.get("/:userInput", auth.optionalAuth, UsersController.getUser);
usersRouter.get("/:userInput/osu", auth.isLoggedIn, UsersController.getOsuUserInfo);
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
usersRouter.post("/:userId/updateEmail", auth.isLoggedIn, auth.isCommittee, UsersController.updateEmail);
usersRouter.get("/:userId/reviewStats", auth.isLoggedIn, auth.isCommittee, UsersController.getReviewStats);

export default usersRouter;
