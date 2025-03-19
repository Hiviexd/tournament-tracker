// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import BeatmapsController from "../controllers/BeatmapsController";

const beatmapsRouter = Router();

beatmapsRouter.post("/check", auth.isLoggedIn, BeatmapsController.checkMappoolCompliance);

export default beatmapsRouter;
