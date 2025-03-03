import express from "express";
import controller from "../controllers/ArticlesController";
import permissions from "../middlewares/permissions";

const articleRouter = express.Router();

articleRouter.get("/:slug", controller.getArticle);
articleRouter.get("/documentation", permissions.isLoggedIn, permissions.isCommittee, controller.getDocumentation);
articleRouter.post("/create", permissions.isLoggedIn, permissions.isAdmin, controller.createArticle);
articleRouter.post("/:slug/edit", permissions.isLoggedIn, permissions.isCommittee, controller.editArticle);

export default articleRouter;
