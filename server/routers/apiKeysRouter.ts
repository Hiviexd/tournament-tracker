// @ts-nocheck
import { Router } from "express";
import auth from "../middlewares/auth";
import ApiKeysController from "../controllers/ApiKeysController";

const router = Router();

router.post("/create", auth.isLoggedIn, ApiKeysController.create);
router.get("/get", auth.isLoggedIn, ApiKeysController.get);
router.post("/revoke", auth.isLoggedIn, ApiKeysController.revoke);

export default router;
