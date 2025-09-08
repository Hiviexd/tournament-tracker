// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import { requireScopes } from "../middlewares/authenticateRequest";
import BeatmapsController from "../controllers/BeatmapsController";

const beatmapsRouter = Router();

beatmapsRouter.post("/check", requireScopes(["beatmaps:read"]), auth.isLoggedIn, BeatmapsController.checkMappoolCompliance);

export default beatmapsRouter;
