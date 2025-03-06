// @ts-nocheck
import express from "express";
import LogsController from "../controllers/LogsController";
import auth from "../middlewares/auth";

const logsRouter = express.Router();

logsRouter.get("/", auth.isLoggedIn, auth.isCommittee, LogsController.index);

export default logsRouter;
