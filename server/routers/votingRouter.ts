import express from "express";
import VotingController from "../controllers/VotingController";
import permissions from "../middlewares/permissions";

const votingRouter = express.Router();

votingRouter.get("/", permissions.isLoggedIn, permissions.isCommittee, VotingController.index);
votingRouter.post("/create", permissions.isLoggedIn, permissions.isCommittee, VotingController.createVoting);
votingRouter.get("/:votingId", permissions.isLoggedIn, permissions.isCommittee, VotingController.getVoting);
votingRouter.post("/:votingId/submitVote", permissions.isLoggedIn, permissions.isCommittee, VotingController.submitVote);
votingRouter.post("/:votingId/toggleStatus", permissions.isLoggedIn, permissions.isCommittee, VotingController.toggleVotingStatus);
votingRouter.post("/:votingId/update", permissions.isLoggedIn, permissions.isCommittee, VotingController.updateVoting);
votingRouter.post("/:votingId/delete", permissions.isLoggedIn, permissions.isCommittee, VotingController.deleteVoting);
votingRouter.post("/:votingId/deleteVote/:voteId", permissions.isLoggedIn, permissions.isAdmin, VotingController.deleteVote);

export default votingRouter;
