import express from "express";
import { login } from "../controllers/auth.controller.js";
const authRouter = express.Router();


authRouter.post("/api/auth/login", login);

export default authRouter 

