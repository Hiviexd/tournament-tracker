// @ts-nocheck
import { Router } from "express";
import TemplatesController from "../controllers/TemplatesController";
import auth from "../middlewares/auth";

const router = Router();

router.use(auth.isLoggedIn, auth.isCommittee);

router.get("/", TemplatesController.index);
router.post("/create", TemplatesController.create);
router.put("/:id/update", TemplatesController.update);
router.delete("/:id/delete", TemplatesController.delete);

export default router;
