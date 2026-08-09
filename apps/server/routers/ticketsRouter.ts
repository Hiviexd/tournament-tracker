// @ts-nocheck
import { Router } from "express";
import TicketsController from "../controllers/TicketsController";
import auth from "../middlewares/auth";
import { handleUpload } from "../middlewares/upload";
import { requireScopes } from "../middlewares/authenticateRequest";

const router = Router();

router.get("/", requireScopes(["tickets:read"]), auth.optionalAuth, TicketsController.index);
router.post("/create", auth.isLoggedIn, handleUpload, TicketsController.create);
router.get("/:ticketId", requireScopes(["tickets:read"]), auth.optionalAuth, TicketsController.getTicket);
router.patch("/:ticketId/sendMessage", auth.isLoggedIn, handleUpload, TicketsController.sendMessage);
router.patch("/:ticketId/toggleStatus", auth.isLoggedIn, auth.isCommittee, TicketsController.toggleStatus);
router.patch("/:ticketId/updateThreadId", auth.isLoggedIn, auth.isCommittee, TicketsController.updateThreadId);
router.patch("/:ticketId/snooze", auth.isLoggedIn, auth.isCommittee, TicketsController.snoozeTicket);
router.patch("/:ticketId/edit", auth.isLoggedIn, auth.isCommittee, TicketsController.editReport);

export default router;
