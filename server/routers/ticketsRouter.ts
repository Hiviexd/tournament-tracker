import { Router } from "express";
import TicketsController from "../controllers/TicketsController";
import permissions from "../middlewares/permissions";

const router = Router();

router.get("/", permissions.isLoggedIn, TicketsController.index);
router.post("/create", permissions.isLoggedIn, TicketsController.create);

export default router;
