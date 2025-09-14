// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import { requireScopes } from "../middlewares/authenticateRequest";
import BeatmapsController from "../controllers/BeatmapsController";
import { deprecate } from "../middlewares/deprecate";

const beatmapsRouter = Router();

beatmapsRouter.post(
    "/check",
    (req, res) => deprecate(req, res, { newRoute: "/compliance/validate" }),
    requireScopes(["beatmaps:read"]),
    auth.isLoggedIn,
    BeatmapsController.checkMappoolCompliance
);

/** @deprecated Replaced with ComplianceRouter */
export default beatmapsRouter;
