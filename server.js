import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create SMTP transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
        port: parseInt(process.env.SMTP_PORT || '2525'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Email notification endpoint
app.post('/api/notifications/email', async (req, res) => {
    try {
        const { recipients, subject, body, actionDetails } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Recipients array is required'
            });
        }

        const transporter = createTransporter();
        const results = [];

        // Send individual emails to each recipient
        for (const recipient of recipients) {
            try {
                const mailOptions = {
                    from: process.env.SMTP_FROM || '"MSO Maestro PDCA" <noreply@msomaestro.com>',
                    to: recipient.email,
                    subject: subject || '[MSO Maestro] Action Assignment Notification',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: linear-gradient(135deg, #435ebe 0%, #5a67d8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
                                .info-box { background: white; padding: 20px; margin: 15px 0; border-left: 4px solid #435ebe; border-radius: 4px; }
                                .label { font-weight: 700; color: #64748b; font-size: 11px; text-transform: uppercase; margin-bottom: 4px; }
                                .value { color: #1a202c; font-size: 14px; margin-bottom: 12px; }
                                .footer { text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px; }
                                .btn { display: inline-block; background: #435ebe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1 style="margin: 0; font-size: 24px;">MSO Maestro PDCA</h1>
                                    <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Assignment Notification</p>
                                </div>
                                <div class="content">
                                    <p>Hello <strong>${recipient.userName}</strong>,</p>
                                    <p>${body || 'You have been assigned to a new action in the PDCA system.'}</p>
                                    
                                    ${actionDetails ? `
                                    <div class="info-box">
                                        <div class="label">Action Title</div>
                                        <div class="value">${actionDetails.title || 'N/A'}</div>
                                        
                                        ${actionDetails.topicTitle ? `
                                        <div class="label">Related Topic</div>
                                        <div class="value">${actionDetails.topicTitle}</div>
                                        ` : ''}
                                        
                                        ${actionDetails.description ? `
                                        <div class="label">Implementation Details</div>
                                        <div class="value">${actionDetails.description}</div>
                                        ` : ''}
                                        
                                        ${actionDetails.dueDate ? `
                                        <div class="label">Due Date</div>
                                        <div class="value">${new Date(actionDetails.dueDate).toLocaleDateString('de-DE')}</div>
                                        ` : ''}
                                        
                                        ${actionDetails.teamsMeeting ? `
                                        <div class="label">Teams Meeting</div>
                                        <div class="value">${new Date(actionDetails.teamsMeeting).toLocaleString('de-DE')}</div>
                                        ` : ''}
                                        
                                        ${actionDetails.teamsMeetingLink ? `
                                        <div style="margin-top: 15px;">
                                            <a href="${actionDetails.teamsMeetingLink}" class="btn" style="background: #6264A7; display: inline-block;">
                                                📹 Join Teams Meeting
                                            </a>
                                        </div>
                                        ` : ''}
                                        
                                        ${actionDetails.owner ? `
                                        <div class="label">Topic Owner</div>
                                        <div class="value">${actionDetails.owner}</div>
                                        ` : ''}
                                    </div>
                                    ` : ''}
                                    
                                    <p style="margin-top: 20px;">
                                        <a href="${process.env.APP_URL || 'http://localhost:5173'}/cockpit" class="btn">Open Action in MSO Maestro</a>
                                    </p>
                                    
                                    <div class="footer">
                                        <p>This is an automated notification from MSO Maestro PDCA Management System.</p>
                                        <p>Please do not reply to this email.</p>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                };

                const info = await transporter.sendMail(mailOptions);

                results.push({
                    recipient: recipient.email,
                    userName: recipient.userName,
                    success: true,
                    messageId: info.messageId
                });

                console.log(`✓ Email sent to ${recipient.userName} (${recipient.email})`);
            } catch (error) {
                console.error(`✗ Failed to send email to ${recipient.email}:`, error.message);
                results.push({
                    recipient: recipient.email,
                    userName: recipient.userName,
                    success: false,
                    error: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
            success: failureCount === 0,
            message: `Sent ${successCount} email(s), ${failureCount} failed`,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                failed: failureCount
            }
        });

    } catch (error) {
        console.error('Email notification error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        smtp: {
            configured: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
            host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
            port: process.env.SMTP_PORT || '2525'
        }
    });
});

app.listen(PORT, () => {
    console.log(`\n🚀 MSO Maestro API Server running on http://localhost:${PORT}`);
    console.log(`📧 SMTP configured: ${!!(process.env.SMTP_USER && process.env.SMTP_PASS) ? 'Yes' : 'No (using defaults)'}`);
    console.log(`📬 SMTP Host: ${process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io'}`);
    console.log(`\n`);
});
