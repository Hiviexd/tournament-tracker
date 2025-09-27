// @ts-nocheck
import express from "express";
import UsersController from "../controllers/UsersController";
import auth from "../middlewares/auth";
import { requireScopes } from "../middlewares/authenticateRequest";

const usersRouter = express.Router();

usersRouter.get("/", auth.optionalAuth, UsersController.index);
usersRouter.get("/me", requireScopes(["users:read"]), auth.isLoggedIn, UsersController.getSelf);
usersRouter.get("/getCommittee", auth.optionalAuth, UsersController.getCommittee);
usersRouter.post("/create", auth.isLoggedIn, UsersController.create);
usersRouter.get("/watchlist", auth.isLoggedIn, auth.isCommittee, UsersController.getWatchlist);
usersRouter.get("/:userId/relatedReportsAndVotings", auth.isLoggedIn, auth.isCommittee, UsersController.getRelatedReportsAndVotings);
usersRouter.get("/:userInput", auth.optionalAuth, UsersController.getUser);
usersRouter.get("/:userInput/osu", auth.isLoggedIn, UsersController.getOsuUserInfo);
usersRouter.patch(
    "/:userId/toggleReviewerStatus",
    auth.isLoggedIn,
    auth.isCommittee,
    UsersController.toggleReviewerStatus
);
usersRouter.patch("/:userId/groupMove", auth.isLoggedIn, auth.isAdmin, UsersController.updateUserGroups);
usersRouter.patch("/:userId/updateBadge", auth.isLoggedIn, auth.isAdmin, UsersController.updateBadge);
usersRouter.patch("/:userId/sync", auth.isLoggedIn, auth.isCommittee, UsersController.syncUser);
usersRouter.patch("/:userId/updateDiscordId", auth.isLoggedIn, auth.isCommittee, UsersController.updateDiscordId);
usersRouter.patch("/:userId/updateEmail", auth.isLoggedIn, auth.isCommittee, UsersController.updateEmail);
usersRouter.get("/:userId/reviewStats", auth.isLoggedIn, auth.isCommittee, UsersController.getReviewStats);
usersRouter.patch("/cycleBag", auth.isLoggedIn, auth.isAdmin, UsersController.cycleBag);
usersRouter.post("/:userId/addInfringement", auth.isLoggedIn, auth.isCommittee, UsersController.addInfringement);

export default usersRouter;
