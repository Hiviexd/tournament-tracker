// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import ApiKeysController from "../controllers/ApiKeysController";
import { apiKeyManagementLimiter } from "../middlewares/rateLimiter";

const router = Router();

router.get("/", auth.isLoggedIn, ApiKeysController.get);
router.get("/all", auth.isLoggedIn, auth.isDev, ApiKeysController.getAll);
router.post("/create", apiKeyManagementLimiter, auth.isLoggedIn, ApiKeysController.create);
router.put("/update", apiKeyManagementLimiter, auth.isLoggedIn, ApiKeysController.update);
router.post("/revoke", apiKeyManagementLimiter, auth.isLoggedIn, ApiKeysController.revoke);
router.post("/revoke/:keyId", apiKeyManagementLimiter, auth.isLoggedIn, auth.isDev, ApiKeysController.revokeById);

export default router;
