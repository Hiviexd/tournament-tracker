// @ts-nocheck
import express from "express";
import TournamentsController from "../controllers/TournamentsController";
import auth from "../middlewares/auth";
import { createUploadMiddleware, handleUpload } from "../middlewares/upload";
import { requireScopes } from "../middlewares/authenticateRequest";

const tournamentsRouter = express.Router();

const tournamentBadgeUpload = createUploadMiddleware({
    maxFiles: 8,
    allowedTypes: ["image/jpeg", "image/png"],
});

tournamentsRouter.get("/", requireScopes(["tournaments:read"]), auth.optionalAuth, TournamentsController.index);
tournamentsRouter.post("/create", auth.isLoggedIn, auth.isCommittee, TournamentsController.create);
tournamentsRouter.get(
    "/:tournamentId",
    requireScopes(["tournaments:read"]),
    auth.optionalAuth,
    TournamentsController.getTournament,
);
tournamentsRouter.put("/:tournamentId/edit", auth.isLoggedIn, TournamentsController.edit);
tournamentsRouter.patch("/bulkEdit", auth.isLoggedIn, auth.isAdmin, TournamentsController.bulkEdit);
tournamentsRouter.patch(
    "/:tournamentId/assignReviewers",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.assignReviewers,
);
tournamentsRouter.patch(
    "/:tournamentId/reassignReviewer",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.reassignReviewer,
);
tournamentsRouter.patch(
    "/:tournamentId/addReviewer",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.addReviewer,
);
tournamentsRouter.patch(
    "/:tournamentId/removeReviewer",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.removeReviewer,
);
tournamentsRouter.patch(
    "/:tournamentId/submitReview",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.submitReview,
);
tournamentsRouter.post(
    "/:tournamentId/uploadBadges",
    auth.isLoggedIn,
    auth.isCommittee,
    tournamentBadgeUpload,
    TournamentsController.uploadBadges,
);
tournamentsRouter.post(
    "/:tournamentId/downloadBadges",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.downloadBadges,
);
tournamentsRouter.patch(
    "/:tournamentId/updateThreadId",
    auth.isLoggedIn,
    auth.isCommittee,
    TournamentsController.updateThreadId,
);
tournamentsRouter.post(
    "/:tournamentId/createNote",
    auth.isLoggedIn,
    auth.isCommittee,
    handleUpload,
    TournamentsController.createNote,
);
tournamentsRouter.delete("/:tournamentId/delete", auth.isLoggedIn, auth.isAdmin, TournamentsController.delete);

export default tournamentsRouter;
