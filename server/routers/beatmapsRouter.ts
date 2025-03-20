// @ts-nocheck
import { Router } from "express";
import BeatmapsController from "../controllers/BeatmapsController";
import { beatmapCheckLimiter } from "../middlewares/rateLimiter";

const beatmapsRouter = Router();

beatmapsRouter.post("/check", beatmapCheckLimiter, BeatmapsController.checkMappoolCompliance);

export default beatmapsRouter;
