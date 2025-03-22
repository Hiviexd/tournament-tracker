// @ts-nocheck
import { Router } from "express";
import VersionController from "../controllers/VersionController";

const versionRouter = Router();

versionRouter.get("/", VersionController.getVersion);

export default versionRouter;
