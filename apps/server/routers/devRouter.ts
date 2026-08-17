// @ts-nocheck
import express from "express";
import DevController from "../controllers/DevController";
import auth from "../middlewares/auth";

const devRouter = express.Router();

devRouter.get("/session", auth.isLoggedIn, auth.isDev, DevController.getSession);
devRouter.post("/session/update", auth.isLoggedIn, auth.isDev, DevController.updateSession);
devRouter.get("/notifications/stats", auth.isLoggedIn, auth.isAdmin, DevController.getNotificationQueueStats);
devRouter.get("/notifications", auth.isLoggedIn, auth.isAdmin, DevController.getNotificationJobsListing);
devRouter.post("/notifications/:id/retry", auth.isLoggedIn, auth.isDev, DevController.retryNotificationJob);

export default devRouter;
