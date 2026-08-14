// @ts-nocheck
import { Router } from "express";
import ChecklistController from "../controllers/ChecklistController";
import auth from "../middlewares/auth";

const checklistRouter = Router();

checklistRouter.get("/", auth.isLoggedIn, auth.isCommittee, ChecklistController.getChecklists);
checklistRouter.put("/", auth.isLoggedIn, auth.isAdmin, ChecklistController.updateChecklists);

export default checklistRouter;
