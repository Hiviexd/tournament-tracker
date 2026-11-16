// @ts-nocheck
import express from "express";
import controller from "../controllers/ResourcesController";
import auth from "../middlewares/auth";
import { requireScopes } from "../middlewares/authenticateRequest";

const resourcesRouter = express.Router();

resourcesRouter.get("/", requireScopes(["resources:read"]), auth.optionalAuth, controller.index);
resourcesRouter.post("/create", auth.isLoggedIn, auth.isCommittee, controller.create);
resourcesRouter.put("/:id/edit", auth.isLoggedIn, auth.isCommittee, controller.edit);
resourcesRouter.delete("/:id/delete", auth.isLoggedIn, auth.isCommittee, controller.delete);
resourcesRouter.post("/:id/restore", auth.isLoggedIn, auth.isAdmin, controller.restore);

export default resourcesRouter;
