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
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }
    initTransporter() {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || "587", 10);
        const secure = process.env.SMTP_SECURE === "true";
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (!host || !user || !pass) {
            console.warn("EmailService: SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS required). Emails will be logged to console.");
            return;
        }
        this.transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });
    }
    verifyConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.transporter) {
                console.warn("EmailService: No SMTP transporter configured.");
                return false;
            }
            try {
                yield this.transporter.verify();
                console.log("EmailService: SMTP connection verified.");
                return true;
            }
            catch (err) {
                console.error("EmailService: SMTP verification failed:", err);
                return false;
            }
        });
    }
    getFrom() {
        return (process.env.SMTP_FROM || `"HARI HR System" <${process.env.SMTP_USER}>`);
    }
    sendPasswordResetEmail(to, resetToken, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
            const resetLink = `${frontendUrl}/#/reset-password?token=${resetToken}`;
            const greeting = userName ? `Hi ${userName},` : "Hi,";
            const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">HARI</h1>
          <p style="color: #a0aec0; margin: 5px 0 0; font-size: 14px;">HR Intelligence by AIYA</p>
        </div>
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #2d3748; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #4a5568; line-height: 1.6;">${greeting}</p>
          <p style="color: #4a5568; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password.
            This link will expire in <strong>30 minutes</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #718096; font-size: 13px; line-height: 1.6;">
            If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #a0aec0; font-size: 12px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color: #4a90d9; word-break: break-all;">${resetLink}</a>
          </p>
        </div>
        <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 20px;">
          &copy; 2026 AIYA Technology. All rights reserved.
        </p>
      </div>
    `;
            const mailOptions = {
                from: this.getFrom(),
                to,
                subject: "HARI - Password Reset Request",
                html,
            };
            if (!this.transporter) {
                console.log("EmailService [DEV]: Password reset email for", to);
                console.log("EmailService [DEV]: Reset link:", resetLink);
                return;
            }
            yield this.transporter.sendMail(mailOptions);
            console.log("EmailService: Password reset email sent to", to);
        });
    }
    sendPasswordResetConfirmation(to, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            const greeting = userName ? `Hi ${userName},` : "Hi,";
            const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">HARI</h1>
          <p style="color: #a0aec0; margin: 5px 0 0; font-size: 14px;">HR Intelligence by AIYA</p>
        </div>
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="color: #2d3748; margin-top: 0;">Password Changed Successfully</h2>
          <p style="color: #4a5568; line-height: 1.6;">${greeting}</p>
          <p style="color: #4a5568; line-height: 1.6;">
            Your password has been successfully reset. You can now log in with your new password.
          </p>
          <p style="color: #e53e3e; font-size: 13px; line-height: 1.6;">
            If you did not make this change, please contact your HR administrator immediately.
          </p>
        </div>
        <p style="color: #a0aec0; font-size: 12px; text-align: center; margin-top: 20px;">
          &copy; 2026 AIYA Technology. All rights reserved.
        </p>
      </div>
    `;
            const mailOptions = {
                from: this.getFrom(),
                to,
                subject: "HARI - Password Changed Successfully",
                html,
            };
            if (!this.transporter) {
                console.log("EmailService [DEV]: Password reset confirmation email for", to);
                return;
            }
            yield this.transporter.sendMail(mailOptions);
            console.log("EmailService: Password reset confirmation sent to", to);
        });
    }
}
exports.default = new EmailService();
