import express from "express";
import UsersController from "../controllers/UsersController";

const usersRouter = express.Router();

usersRouter.get("/", UsersController.index);
usersRouter.get("/:userInput", UsersController.getUser);

export default usersRouter;