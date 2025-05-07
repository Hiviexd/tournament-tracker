// @ts-nocheck
import express from "express";
import controller from "../controllers/ResourcesController";
import auth from "../middlewares/auth";

const resourcesRouter = express.Router();

resourcesRouter.get("/", controller.index);
resourcesRouter.post("/create", auth.isLoggedIn, auth.isCommittee, controller.create);
resourcesRouter.put("/:id/edit", auth.isLoggedIn, auth.isCommittee, controller.edit);
resourcesRouter.delete("/:id/delete", auth.isLoggedIn, auth.isCommittee, controller.delete);

export default resourcesRouter;
