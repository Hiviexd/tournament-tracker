// @ts-nocheck
import express from "express";
import controller from "../controllers/ArticlesController";
import auth from "../middlewares/auth";

const articleRouter = express.Router();

articleRouter.get("/documentation", auth.isLoggedIn, auth.isCommittee, controller.getDocumentation);
articleRouter.post("/create", auth.isLoggedIn, auth.isAdmin, controller.createArticle);
articleRouter.get("/:slug", auth.optionalAuth, controller.getArticle);
articleRouter.post("/:slug/edit", auth.isLoggedIn, auth.isCommittee, controller.editArticle);
articleRouter.post("/:slug/delete", auth.isLoggedIn, auth.isAdmin, controller.deleteArticle);

export default articleRouter;
