import express from "express";
import LogsController from "../controllers/LogsController";
import permissions from "../middlewares/permissions";

const logsRouter = express.Router();

logsRouter.get("/", permissions.isLoggedIn, permissions.isAdmin, LogsController.index);

export default logsRouter;
