import { Router } from "express";
import TicketsController from "../controllers/TicketsController";
import permissions from "../middlewares/permissions";
import { handleUpload } from "../middlewares/upload";

const router = Router();

router.get("/", permissions.isLoggedIn, TicketsController.index);
router.post("/create", permissions.isLoggedIn, TicketsController.create);
router.get("/:ticketId", permissions.isLoggedIn, TicketsController.getTicket);
router.post("/:ticketId/sendMessage", permissions.isLoggedIn, handleUpload, TicketsController.sendMessage);
router.post("/:ticketId/toggleStatus", permissions.isLoggedIn, permissions.isCommittee, TicketsController.toggleStatus);

export default router;
