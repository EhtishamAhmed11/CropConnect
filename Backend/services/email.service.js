import nodemailer from "nodemailer";

// Using a mock transport or generic SMTP. 
// For real usage, user needs to provide SMTP credentials in .env
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email", // Fallback to ethereal for dev
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "test@ethereal.email",
        pass: process.env.SMTP_PASS || "pass"
    },
});

export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"CropConnect System" <system@cropconnect.com>',
            to,
            subject,
            html,
        });

        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        if (process.env.SMTP_HOST?.includes("ethereal")) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

export const sendDailyReport = async (to, data) => {
    const subject = `CropConnect Daily Report - ${new Date().toLocaleDateString()}`;
    const html = `
        <h1>Daily Summary</h1>
        <p>Here is your daily overview of crop production and market trends.</p>
        
        <h2>Alerts</h2>
        <p>${data.alertsCount} new alerts generated today.</p>
        
        <h2>Market Updates</h2>
        <p>Latest wheat price: ${data.wheatPrice ? data.wheatPrice + " PKR" : "N/A"}</p>
        
        <p><a href="http://localhost:5173/dashboard">View Full Dashboard</a></p>
    `;

    return sendEmail(to, subject, html);
};
