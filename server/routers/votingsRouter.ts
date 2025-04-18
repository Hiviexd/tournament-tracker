// @ts-nocheck
import express from "express";
import VotingsController from "../controllers/VotingsController";
import auth from "../middlewares/auth";
import { handleUpload } from "../middlewares/upload";

const votingsRouter = express.Router();

votingsRouter.get("/", auth.optionalAuth, VotingsController.index);
votingsRouter.post("/create", auth.isLoggedIn, auth.isCommittee, handleUpload, VotingsController.createVoting);
votingsRouter.get("/:votingId", auth.optionalAuth, VotingsController.getVoting);
votingsRouter.post("/:votingId/submitVote", auth.isLoggedIn, auth.isCommittee, VotingsController.submitVote);
votingsRouter.post("/:votingId/toggleStatus", auth.isLoggedIn, auth.isCommittee, VotingsController.toggleVotingStatus);
votingsRouter.post("/:votingId/update", auth.isLoggedIn, auth.isCommittee, VotingsController.updateVoting);
votingsRouter.post("/:votingId/delete", auth.isLoggedIn, auth.isCommittee, VotingsController.deleteVoting);
votingsRouter.post("/:votingId/togglePublic", auth.isLoggedIn, auth.isCommittee, VotingsController.toggleVotingPublic);
votingsRouter.post("/:votingId/clearVotes", auth.isLoggedIn, auth.isAdmin, VotingsController.clearVotes);

export default votingsRouter;
