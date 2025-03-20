// @ts-nocheck
import { Router } from "express";
import BeatmapsController from "../controllers/BeatmapsController";

const beatmapsRouter = Router();

beatmapsRouter.post("/check", BeatmapsController.checkMappoolCompliance);

export default beatmapsRouter;
