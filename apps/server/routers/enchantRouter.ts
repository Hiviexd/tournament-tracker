// @ts-nocheck
import { Router } from "express";
import EnchantController from "../controllers/EnchantController";

const enchantRouter = Router();

enchantRouter.post("/sidebar", EnchantController.sidebar);

export default enchantRouter;
