import express from "express";
import AuthController from "../controllers/AuthController";

const authRouter = express.Router();

authRouter.get("/login", AuthController.login);
authRouter.get("/logout", AuthController.logout);
authRouter.get("/callback", AuthController.callback);

export default authRouter;
