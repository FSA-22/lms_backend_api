import express from "express";
import { getUser } from "../controllers/user.controller.js";
import { tokenAuthenticator } from "../middleware/auth.middleware.js";
const userRouter = express.Router();

userRouter.get("/api/user", tokenAuthenticator, getUser);

export default userRouter;