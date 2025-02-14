import express from "express";
import ProxyController from "../controllers/ProxyController";

const proxyRouter = express.Router();

proxyRouter.get("/", ProxyController.proxyImage);

export default proxyRouter;
