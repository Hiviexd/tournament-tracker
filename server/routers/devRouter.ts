// @ts-nocheck
import express from "express";
import DevController from "../controllers/DevController";
import auth from "../middlewares/auth";

const devRouter = express.Router();

devRouter.get("/session", auth.isLoggedIn, auth.isDev, DevController.getSession);
devRouter.post("/session/update", auth.isLoggedIn, auth.isDev, DevController.updateSession);

export default devRouter;
