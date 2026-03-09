import nodemailer from "nodemailer";

// Gmail SMTP configuration using app password
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || ""
    },
});

export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"CropConnect System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log("Email sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

export const sendDailyReport = async (to, data) => {
    const subject = `CropConnect Daily Report - ${new Date().toLocaleDateString()}`;
    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px 32px; color: white;">
                <h1 style="margin: 0; font-size: 22px;">📊 Daily Report</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div style="padding: 24px 32px;">
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">🔔 Alerts Today</h3>
                    <p style="margin: 0; color: #475569; font-size: 24px; font-weight: bold;">${data.alertsCount} <span style="font-size: 14px; font-weight: normal;">new alerts</span></p>
                </div>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <h3 style="margin: 0 0 12px; color: #1e293b; font-size: 16px;">🌾 Market Update</h3>
                    <p style="margin: 0; color: #475569;">Latest wheat price: <strong>${data.wheatPrice ? data.wheatPrice + " PKR" : "N/A"}</strong></p>
                </div>
                <a href="http://localhost:5173/dashboard" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                    View Full Dashboard
                </a>
            </div>
            <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">CropConnect Alert System</p>
            </div>
        </div>
    `;

    return sendEmail(to, subject, html);
};

export const sendVerificationEmail = async (to, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
    const subject = `✅ Verify Your CropConnect Account`;
    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #16a34a, #22c55e); padding: 32px; color: white; text-align: center;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 800;">🌾 CropConnect</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">Welcome! Please verify your email address.</p>
            </div>
            <div style="padding: 32px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                    Thank you for registering with <strong>CropConnect</strong>. Click the button below to verify your email address and activate your account.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #22c55e); color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px;">
                        ✅ Verify My Email
                    </a>
                </div>
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-top: 24px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">
                        Or copy and paste this link into your browser:<br/>
                        <a href="${verificationUrl}" style="color: #16a34a; word-break: break-all;">${verificationUrl}</a>
                    </p>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                    ⏱️ This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
                </p>
            </div>
            <div style="padding: 16px 32px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">CropConnect — Agricultural Intelligence Platform</p>
            </div>
        </div>
    `;
    return sendEmail(to, subject, html);
};

export const sendPasswordResetEmail = async (to, resetUrl) => {
    const subject = `🔐 Reset Your CropConnect Password`;
    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 32px; color: white; text-align: center;">
                <h1 style="margin: 0; font-size: 26px; font-weight: 800;">🌾 CropConnect</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 15px;">Password Reset Request</p>
            </div>
            <div style="padding: 32px;">
                <p style="color: #334155; font-size: 16px; line-height: 1.7; margin: 0 0 24px;">
                    We received a request to reset your password. Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px;">
                        🔐 Reset My Password
                    </a>
                </div>
                <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-top: 24px;">
                    <p style="margin: 0; color: #64748b; font-size: 13px;">
                        Or copy and paste this link into your browser:<br/>
                        <a href="${resetUrl}" style="color: #1e40af; word-break: break-all;">${resetUrl}</a>
                    </p>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                    🛡️ If you did not request a password reset, please ignore this email. Your password will not change.
                </p>
            </div>
            <div style="padding: 16px 32px; background: #f1f5f9; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">CropConnect — Agricultural Intelligence Platform</p>
            </div>
        </div>
    `;
    return sendEmail(to, subject, html);
};

export const sendWeatherAlert = async (to, alertData) => {
    const subject = `⚠️ Weather Alert: ${alertData.title}`;
    const html = `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
            <div style="background: #ea580c; padding: 24px 32px; color: white;">
                <h1 style="margin: 0; font-size: 20px;">⚠️ ${alertData.title}</h1>
                <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${alertData.district || 'District'}</p>
            </div>
            <div style="padding: 24px 32px;">
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">${alertData.message}</p>
                <a href="http://localhost:5173/weather" style="display: inline-block; background: #ea580c; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 12px;">
                    View Weather Data
                </a>
            </div>
            <div style="padding: 16px 32px; background: #f1f5f9; text-align: center;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">CropConnect Alert System</p>
            </div>
        </div>
    `;

    return sendEmail(to, subject, html);
};
