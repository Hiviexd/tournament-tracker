import express from "express";
import LogsController from "../controllers/LogsController";
import permissions from "../middlewares/permissions";

const logsRouter = express.Router();

logsRouter.get("/", permissions.isLoggedIn, permissions.isCommittee, LogsController.index);

export default logsRouter;
