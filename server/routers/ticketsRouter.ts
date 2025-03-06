// @ts-nocheck
import { Router } from "express";
import TicketsController from "../controllers/TicketsController";
import auth from "../middlewares/auth";
import { handleUpload } from "../middlewares/upload";

const router = Router();

router.get("/", auth.isLoggedIn, TicketsController.index);
router.post("/create", auth.isLoggedIn, handleUpload, TicketsController.create);
router.get("/:ticketId", auth.isLoggedIn, TicketsController.getTicket);
router.post("/:ticketId/sendMessage", auth.isLoggedIn, handleUpload, TicketsController.sendMessage);
router.post("/:ticketId/toggleStatus", auth.isLoggedIn, auth.isCommittee, TicketsController.toggleStatus);

export default router;
