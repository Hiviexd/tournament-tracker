// @ts-nocheck
import express from "express";
import TournamentsController from "../controllers/TournamentsController";
import auth from "../middlewares/auth";
import { createUploadMiddleware } from "../middlewares/upload";

const tournamentsRouter = express.Router();

const tournamentUpload = createUploadMiddleware({
    maxFiles: 1,
    allowedTypes: ["image/jpeg", "image/png"],
});

tournamentsRouter.get("/", auth.isLoggedIn, auth.isAdmin, TournamentsController.index);
tournamentsRouter.post("/create", auth.isLoggedIn, auth.isAdmin, tournamentUpload, TournamentsController.create);

export default tournamentsRouter;
