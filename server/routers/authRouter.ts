// @ts-nocheck
import express from "express";
import AuthController from "../controllers/AuthController";

const authRouter = express.Router();

authRouter.get("/login", AuthController.login);
authRouter.post("/logout", AuthController.logout);
authRouter.get("/callback", AuthController.callback);
authRouter.get("/csrf", AuthController.getCsrfToken);

export default authRouter;
