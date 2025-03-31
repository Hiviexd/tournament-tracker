// @ts-nocheck
import express from "express";
import TournamentsController from "../controllers/TournamentsController";
import auth from "../middlewares/auth";
import { createUploadMiddleware } from "../middlewares/upload";

const tournamentsRouter = express.Router();

const tournamentBannerUpload = createUploadMiddleware({
    maxFiles: 1,
    allowedTypes: ["image/jpeg", "image/png"],
});

const tournamentBadgeUpload = createUploadMiddleware({
    maxFiles: 8,
    allowedTypes: ["image/jpeg", "image/png"],
});

tournamentsRouter.get("/", auth.optionalAuth, TournamentsController.index);
tournamentsRouter.post("/create", auth.isLoggedIn, auth.isCommittee, tournamentBannerUpload, TournamentsController.create);
tournamentsRouter.get("/:tournamentId", auth.optionalAuth, TournamentsController.getTournament);
tournamentsRouter.post("/:tournamentId/edit", auth.isLoggedIn, auth.isCommittee, TournamentsController.edit);
tournamentsRouter.post("/:tournamentId/assignReviewers", auth.isLoggedIn, auth.isCommittee, TournamentsController.assignReviewers);
tournamentsRouter.post("/:tournamentId/reassignReviewer", auth.isLoggedIn, auth.isCommittee, TournamentsController.reassignReviewer);
tournamentsRouter.post("/:tournamentId/submitReview", auth.isLoggedIn, auth.isCommittee, TournamentsController.submitReview);
tournamentsRouter.post("/:tournamentId/uploadBadges", auth.isLoggedIn, auth.isCommittee, tournamentBadgeUpload, TournamentsController.uploadBadges);
tournamentsRouter.get("/:tournamentId/downloadBadges", auth.isLoggedIn, auth.isCommittee, TournamentsController.downloadBadges);
tournamentsRouter.post("/:tournamentId/updateThreadId", auth.isLoggedIn, auth.isCommittee, TournamentsController.updateThreadId);

export default tournamentsRouter;
