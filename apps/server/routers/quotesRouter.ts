// @ts-nocheck
import { Router } from "express";
import quotesController from "../controllers/QuotesController";
import auth from "../middlewares/auth";

const quotesRouter = Router();

quotesRouter.get("/", quotesController.getRandomQuote);
quotesRouter.get("/all", auth.isLoggedIn, auth.isCommittee, quotesController.getAllQuotes);
quotesRouter.post("/create", auth.isLoggedIn, auth.isCommittee, quotesController.createQuote);

export default quotesRouter;
