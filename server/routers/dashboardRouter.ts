// @ts-nocheck
import express from "express";
import DashboardController from "../controllers/DashboardController";
import auth from "../middlewares/auth";

const dashboardRouter = express.Router();

dashboardRouter.get("/", auth.isLoggedIn, auth.isCommittee, DashboardController.index);

export default dashboardRouter;