import express from "express";
import VotingsController from "../controllers/VotingsController";
import permissions from "../middlewares/permissions";

const votingRouter = express.Router();

votingRouter.get("/", permissions.isLoggedIn, permissions.isCommittee, VotingsController.index);
votingRouter.post("/create", permissions.isLoggedIn, permissions.isCommittee, VotingsController.createVoting);
votingRouter.get("/:votingId", permissions.isLoggedIn, permissions.isCommittee, VotingsController.getVoting);
votingRouter.post("/:votingId/submitVote", permissions.isLoggedIn, permissions.isCommittee, VotingsController.submitVote);
votingRouter.post("/:votingId/toggleStatus", permissions.isLoggedIn, permissions.isCommittee, VotingsController.toggleVotingStatus);
votingRouter.post("/:votingId/update", permissions.isLoggedIn, permissions.isCommittee, VotingsController.updateVoting);
votingRouter.post("/:votingId/delete", permissions.isLoggedIn, permissions.isCommittee, VotingsController.deleteVoting);
votingRouter.post("/:votingId/deleteVote/:voteId", permissions.isLoggedIn, permissions.isAdmin, VotingsController.deleteVote);

export default votingRouter;
