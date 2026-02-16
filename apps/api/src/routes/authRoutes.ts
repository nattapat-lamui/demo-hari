import { Router } from "express";
import AuthController from "../controllers/AuthController";
import {
  authLimiter,
  forgotPasswordLimiter,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRequest,
} from "../middlewares/security";
import { authenticateToken } from "../middlewares/auth";

const router = Router();

// POST /api/auth/login - User login
router.post(
  "/login",
  authLimiter,
  validateLogin,
  validateRequest,
  AuthController.login.bind(AuthController),
);

// POST /api/auth/change-password - Change password (protected)
router.post(
  "/change-password",
  authenticateToken,
  AuthController.changePassword.bind(AuthController),
);

// POST /api/auth/register - Self-registration for employees
router.post(
  "/register",
  authLimiter,
  AuthController.register.bind(AuthController),
);

// POST /api/auth/forgot-password - Request password reset
router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  validateForgotPassword,
  validateRequest,
  AuthController.forgotPassword.bind(AuthController),
);

// POST /api/auth/reset-password - Reset password with token
router.post(
  "/reset-password",
  authLimiter,
  validateResetPassword,
  validateRequest,
  AuthController.resetPassword.bind(AuthController),
);

// POST /api/auth/refresh - Refresh access token (no auth required — token is expired)
router.post(
  "/refresh",
  authLimiter,
  AuthController.refresh.bind(AuthController),
);

// POST /api/auth/logout - Revoke refresh token (no auth required — token may be expired)
router.post(
  "/logout",
  AuthController.logout.bind(AuthController),
);

// GET /api/auth/check-email - Check if email is eligible for registration
router.get(
  "/check-email",
  authLimiter,
  AuthController.checkEmail.bind(AuthController),
);

export default router;
