// @ts-nocheck
import { Router } from "express";
import TicketsController from "../controllers/TicketsController";
import auth from "../middlewares/auth";
import { handleUpload } from "../middlewares/upload";

const router = Router();

router.get("/", auth.optionalAuth, TicketsController.index);
router.post("/create", auth.isLoggedIn, handleUpload, TicketsController.create);
router.get("/:ticketId", auth.optionalAuth, TicketsController.getTicket);
router.patch("/:ticketId/sendMessage", auth.isLoggedIn, handleUpload, TicketsController.sendMessage);
router.patch("/:ticketId/toggleStatus", auth.isLoggedIn, auth.isCommittee, TicketsController.toggleStatus);
router.patch("/:ticketId/updateThreadId", auth.isLoggedIn, auth.isCommittee, TicketsController.updateThreadId);

export default router;
