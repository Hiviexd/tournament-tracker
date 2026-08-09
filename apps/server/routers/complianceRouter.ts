// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import { requireScopes } from "../middlewares/authenticateRequest";
import ComplianceController from "../controllers/ComplianceController";

const complianceRouter = Router();

complianceRouter.post(
    "/validate",
    requireScopes(["compliance:read"]),
    auth.isLoggedIn,
    ComplianceController.validateBeatmaps,
);

export default complianceRouter;
