import express from "express";
import {
  registerTenant,
  registerStudent,
  registerInstructor,
  login,
  refresh,
  logout,
  logoutAll,
} from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import roleMiddleware from "../middleware/role.middleware.js";
import loginRateLimit from "../middleware/login-rate-limit.middleware.js";

const router = express.Router();

router.post("/register-tenant", registerTenant);
router.post("/register-student", registerStudent);
router.post("/register-instructor", registerInstructor);
router.post("/login", loginRateLimit, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAll);
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});
router.get("/tenant-only", authMiddleware, roleMiddleware(["TENANT"]), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authorized as TENANT",
  });
});

export default router;
