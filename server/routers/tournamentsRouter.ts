// @ts-nocheck
import express from "express";
import TournamentsController from "../controllers/TournamentsController";
import auth from "../middlewares/auth";

const tournamentsRouter = express.Router();

tournamentsRouter.get("/", auth.isLoggedIn, auth.isAdmin, TournamentsController.index);
tournamentsRouter.post("/create", auth.isLoggedIn, auth.isAdmin, TournamentsController.create);

export default tournamentsRouter;
