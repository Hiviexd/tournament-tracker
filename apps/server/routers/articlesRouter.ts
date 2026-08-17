// @ts-nocheck
import express from "express";
import controller from "../controllers/ArticlesController";
import auth from "../middlewares/auth";

const articleRouter = express.Router();

articleRouter.get("/documentation", auth.isLoggedIn, auth.isCommittee, controller.getDocumentation);
articleRouter.get("/news", auth.optionalAuth, controller.getNews);
articleRouter.get("/news/:slug", controller.getNewsPost);
articleRouter.post("/news/create", auth.isLoggedIn, auth.isCommittee, controller.createNewsPost);
articleRouter.put("/news/:slug/edit", auth.isLoggedIn, auth.isCommittee, controller.editNewsPost);
articleRouter.post("/create", auth.isLoggedIn, auth.isAdmin, controller.createArticle);
articleRouter.get("/:slug", auth.optionalAuth, controller.getArticle);
articleRouter.put("/:slug/edit", auth.isLoggedIn, auth.isCommittee, controller.editArticle);
articleRouter.delete("/:slug/delete", auth.isLoggedIn, auth.isAdmin, controller.deleteArticle);

export default articleRouter;
