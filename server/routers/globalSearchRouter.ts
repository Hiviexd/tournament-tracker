// @ts-nocheck
import express from "express";
import GlobalSearchController from "../controllers/GlobalSearchController";
import auth from "../middlewares/auth";

const globalSearchRouter = express.Router();

globalSearchRouter.get("/", auth.isLoggedIn, auth.isCommittee, GlobalSearchController.index);

export default globalSearchRouter;
