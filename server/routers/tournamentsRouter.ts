import express from "express";
import TournamentsController from "../controllers/TournamentsController";
import permissions from "../middlewares/permissions";

const tournamentsRouter = express.Router();

tournamentsRouter.get("/", permissions.isLoggedIn, TournamentsController.index);
tournamentsRouter.post("/create", permissions.isLoggedIn, permissions.isCommittee, TournamentsController.create);

export default tournamentsRouter;
