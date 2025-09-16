// @ts-nocheck
import express from "express";
import VotingsController from "../controllers/VotingsController";
import auth from "../middlewares/auth";
import { handleUpload } from "../middlewares/upload";
import { requireScopes } from "../middlewares/authenticateRequest";

const votingsRouter = express.Router();

votingsRouter.get("/", requireScopes(["votings:read"]), auth.optionalAuth, VotingsController.index);
votingsRouter.post("/create", auth.isLoggedIn, auth.isCommittee, handleUpload, VotingsController.createVoting);
votingsRouter.get("/:votingId", requireScopes(["votings:read"]), auth.optionalAuth, VotingsController.getVoting);
votingsRouter.post("/:votingId/submitVote", auth.isLoggedIn, auth.isCommittee, VotingsController.submitVote);
votingsRouter.patch("/:votingId/toggleStatus", auth.isLoggedIn, auth.isCommittee, VotingsController.toggleVotingStatus);
votingsRouter.put("/:votingId/update", auth.isLoggedIn, auth.isCommittee, VotingsController.updateVoting);
votingsRouter.delete("/:votingId/delete", auth.isLoggedIn, auth.isCommittee, VotingsController.deleteVoting);
votingsRouter.patch("/:votingId/togglePublic", auth.isLoggedIn, auth.isCommittee, VotingsController.toggleVotingPublic);
votingsRouter.delete("/:votingId/clearVotes", auth.isLoggedIn, auth.isAdmin, VotingsController.clearVotes);
votingsRouter.patch("/:votingId/toggleAbstention", auth.isLoggedIn, auth.isCommittee, VotingsController.toggleAbstention);

export default votingsRouter;
