import express from "express";
import {
  registerTenant,
  registerStudent,
  registerInstructor,
  login,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register-tenant", registerTenant);
router.post("/register-student", registerStudent);
router.post("/register-instructor", registerInstructor);
router.post("/login", login);

export default router;
