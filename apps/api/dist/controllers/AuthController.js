"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = __importDefault(require("../services/AuthService"));
class AuthController {
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, rememberMe } = req.body;
                if (!email || !password) {
                    res.status(400).json({ error: "Email and password are required" });
                    return;
                }
                const authResponse = yield AuthService_1.default.login({ email, password }, rememberMe);
                res.json(authResponse);
            }
            catch (error) {
                console.error("Login error:", error);
                res.status(401).json({ error: error.message || "Login failed" });
            }
        });
    }
    changePassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
                if (!userId) {
                    res.status(401).json({ error: "Unauthorized" });
                    return;
                }
                const { currentPassword, newPassword } = req.body;
                if (!currentPassword || !newPassword) {
                    res
                        .status(400)
                        .json({ error: "Current and new password are required" });
                    return;
                }
                if (newPassword.length < 8) {
                    res
                        .status(400)
                        .json({ error: "New password must be at least 8 characters" });
                    return;
                }
                yield AuthService_1.default.changePassword(userId, {
                    currentPassword,
                    newPassword,
                });
                res.json({ message: "Password changed successfully" });
            }
            catch (error) {
                console.error("Change password error:", error);
                res
                    .status(400)
                    .json({ error: error.message || "Failed to change password" });
            }
        });
    }
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password, confirmPassword } = req.body;
                if (!email || !password || !confirmPassword) {
                    res.status(400).json({ error: "Email, password, and confirm password are required" });
                    return;
                }
                const authResponse = yield AuthService_1.default.register({ email, password, confirmPassword });
                res.status(201).json(authResponse);
            }
            catch (error) {
                console.error("Registration error:", error);
                res.status(400).json({ error: error.message || "Registration failed" });
            }
        });
    }
    forgotPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const genericMessage = "If an account exists with this email, you will receive a password reset link shortly.";
            try {
                const { email } = req.body;
                if (!email) {
                    res.status(400).json({ error: "Email is required" });
                    return;
                }
                yield AuthService_1.default.forgotPassword(email);
                res.json({ message: genericMessage });
            }
            catch (error) {
                // Always return same generic message to prevent user enumeration
                console.error("Forgot password error:", error);
                res.json({ message: genericMessage });
            }
        });
    }
    resetPassword(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { token, newPassword, confirmPassword } = req.body;
                if (!token || !newPassword || !confirmPassword) {
                    res
                        .status(400)
                        .json({ error: "Token, new password, and confirm password are required" });
                    return;
                }
                if (newPassword !== confirmPassword) {
                    res.status(400).json({ error: "Passwords do not match" });
                    return;
                }
                yield AuthService_1.default.resetPassword(token, newPassword);
                res.json({ message: "Password has been reset successfully." });
            }
            catch (error) {
                console.error("Reset password error:", error);
                res
                    .status(400)
                    .json({ error: error.message || "Failed to reset password" });
            }
        });
    }
    refresh(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (!refreshToken) {
                    res.status(400).json({ error: "Refresh token is required" });
                    return;
                }
                const authResponse = yield AuthService_1.default.refreshAccessToken(refreshToken);
                res.json(authResponse);
            }
            catch (error) {
                console.error("Token refresh error:", error);
                res.status(401).json({ error: error.message || "Token refresh failed" });
            }
        });
    }
    logout(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { refreshToken } = req.body;
                if (refreshToken) {
                    yield AuthService_1.default.revokeRefreshToken(refreshToken);
                }
                res.json({ message: "Logged out successfully" });
            }
            catch (error) {
                // Always return success for logout (best-effort)
                console.error("Logout error:", error);
                res.json({ message: "Logged out successfully" });
            }
        });
    }
    checkEmail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { email } = req.query;
                if (!email || typeof email !== 'string') {
                    res.status(400).json({ error: "Email is required" });
                    return;
                }
                const result = yield AuthService_1.default.checkEmailEligibility(email);
                res.json(result);
            }
            catch (error) {
                console.error("Check email error:", error);
                res.status(500).json({ error: error.message || "Failed to check email" });
            }
        });
    }
}
exports.AuthController = AuthController;
exports.default = new AuthController();
