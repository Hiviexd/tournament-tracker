// @ts-nocheck
import express from "express";
import GlobalSearchController from "../controllers/GlobalSearchController";
import auth from "../middlewares/auth";

const globalSearchRouter = express.Router();

globalSearchRouter.get("/", auth.optionalAuth, GlobalSearchController.index);

export default globalSearchRouter;
