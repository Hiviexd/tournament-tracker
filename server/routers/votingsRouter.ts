import express from "express";
import VotingsController from "../controllers/VotingsController";
import permissions from "../middlewares/permissions";
import { handleUpload } from "../middlewares/upload";

const votingsRouter = express.Router();

votingsRouter.get("/", permissions.isLoggedIn, permissions.isCommittee, VotingsController.index);
votingsRouter.post("/create", permissions.isLoggedIn, permissions.isCommittee, handleUpload, VotingsController.createVoting);
votingsRouter.get("/:votingId", permissions.isLoggedIn, permissions.isCommittee, VotingsController.getVoting);
votingsRouter.post("/:votingId/submitVote", permissions.isLoggedIn, permissions.isCommittee, VotingsController.submitVote);
votingsRouter.post("/:votingId/toggleStatus", permissions.isLoggedIn, permissions.isCommittee, VotingsController.toggleVotingStatus);
votingsRouter.post("/:votingId/update", permissions.isLoggedIn, permissions.isCommittee, VotingsController.updateVoting);
votingsRouter.post("/:votingId/delete", permissions.isLoggedIn, permissions.isCommittee, VotingsController.deleteVoting);

export default votingsRouter;
