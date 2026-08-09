// @ts-nocheck
import { Router } from "express";
import InfringementsController from "../controllers/InfringementsController";
import auth from "../middlewares/auth";

const infringementsRouter = Router();

infringementsRouter.get("/watchlist", auth.isLoggedIn, auth.isCommittee, InfringementsController.getWatchlist);
infringementsRouter.post("/add", auth.isLoggedIn, auth.isCommittee, InfringementsController.addInfringement);
infringementsRouter.patch(
    "/:infringementId/edit",
    auth.isLoggedIn,
    auth.isCommittee,
    InfringementsController.updateInfringement,
);

export default infringementsRouter;
