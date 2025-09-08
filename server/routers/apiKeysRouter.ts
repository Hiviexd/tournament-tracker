// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import ApiKeysController from "../controllers/ApiKeysController";
import { apiKeyManagementLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.post("/create",apiKeyManagementLimiter,  auth.isLoggedIn,  ApiKeysController.create);
router.get("/get", auth.isLoggedIn, ApiKeysController.get);
router.post("/revoke", apiKeyManagementLimiter, auth.isLoggedIn, ApiKeysController.revoke);

export default router;
