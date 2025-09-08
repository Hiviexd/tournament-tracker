// @ts-nocheck
import express from "express";
import AuthController from "../controllers/AuthController";
import { csrfTokenFetchLimiter } from "../middlewares/rateLimiter";

const authRouter = express.Router();

authRouter.get("/login", AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/callback", AuthController.callback);
authRouter.get("/csrf", csrfTokenFetchLimiter, AuthController.getCsrfToken);

export default authRouter;
