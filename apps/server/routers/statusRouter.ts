// @ts-nocheck
import { Router } from "express";
import StatusController from "../controllers/StatusController";

const statusRouter = Router();

statusRouter.get("/", StatusController.getStatus);

export default statusRouter;
