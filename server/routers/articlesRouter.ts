// @ts-nocheck
import express from "express";
import controller from "../controllers/ArticlesController";
import permissions from "../middlewares/permissions";

const articleRouter = express.Router();

articleRouter.get("/:slug/public", controller.getPublicArticle);
articleRouter.get("/:slug/private", permissions.isLoggedIn, controller.getPrivateArticle);
articleRouter.get("/documentation", permissions.isLoggedIn, permissions.isCommittee, controller.getDocumentation);
articleRouter.post("/create", permissions.isLoggedIn, permissions.isAdmin, controller.createArticle);
articleRouter.post("/:slug/edit", permissions.isLoggedIn, permissions.isCommittee, controller.editArticle);
articleRouter.post("/:slug/delete", permissions.isLoggedIn, permissions.isAdmin, controller.deleteArticle);

export default articleRouter;
