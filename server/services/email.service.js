import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    // Check if new SMTP environment variables are configured
    const hasCredentials = process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD;

    if (!hasCredentials) {
      logger.info('No SMTP credentials found in environment. Using JSON Mock Transport for emails.');
      this.transporter = nodemailer.createTransport({
        jsonTransport: true
      });
      this.isMock = true;
    } else {
      const secureValue = process.env.SMTP_PORT === '465';
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: secureValue,
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });
      this.isMock = false;
    }

    this.from = process.env.SMTP_EMAIL || 'no-reply@worksphere.com';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  /**
   * Helper to verify connection to SMTP server on startup/check
   */
  async verifyConnection() {
    if (this.isMock) {
      logger.info('SMTP Transporter verified successfully (JSON Mock Transport).');
      return true;
    }
    try {
      await this.transporter.verify();
      logger.info('SMTP Transporter verified successfully.');
      return true;
    } catch (error) {
      logger.error('SMTP Connection Verification Failed:', error.message);
      return false;
    }
  }

  /**
   * Helper to send an HTML email
   */
  async sendMail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `WorkSphere <${this.from}>`,
        to,
        subject,
        text,
        html
      };

      const info = await this.transporter.sendMail(mailOptions);
      if (this.isMock) {
        logger.info(`[MOCK EMAIL SENT] To: ${to} | Subject: ${subject}`);
        logger.info(`[MOCK EMAIL CONTENT]\n${text}\n`);
      } else {
        logger.info(`Email successfully sent: messageId=${info.messageId} to=${to}`);
      }
      return info;
    } catch (error) {
      logger.error(`Error delivering email to ${to}:`, error.message);
      throw new Error(`Email delivery failed: ${error.message}`);
    }
  }

  /**
   * Sends the Password Reset HTML Email
   */
  async sendPasswordReset(email, name, resetToken) {
    const resetUrl = `${this.clientUrl}/reset-password/${resetToken}`;
    const subject = 'Reset Your WorkSphere Password';
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          color: #1e293b;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #0ea5e9;
          padding: 30px;
          text-align: center;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.5px;
          text-decoration: none;
        }
        .content {
          padding: 40px 30px;
        }
        h1 {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 16px;
        }
        p {
          font-size: 15px;
          line-height: 24px;
          color: #334155;
          margin-bottom: 24px;
        }
        .btn-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          background-color: #0ea5e9;
          color: #ffffff !important;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.2);
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #0284c7;
        }
        .fallback {
          font-size: 13px;
          color: #64748b;
          word-break: break-all;
          background-color: #f1f5f9;
          padding: 12px;
          border-radius: 6px;
          border: 1px dashed #cbd5e1;
        }
        .footer {
          background-color: #f8fafc;
          padding: 24px 30px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .footer a {
          color: #0ea5e9;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">WorkSphere</div>
        </div>
        <div class="content">
          <h1>Password Reset Request</h1>
          <p>Hi ${name || 'there'},</p>
          <p>We received a request to reset the password for your WorkSphere account. Click the button below to set up a new password. This link is single-use and will expire in <strong>15 minutes</strong>.</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          
          <p>If the button doesn't work, copy and paste the following URL into your web browser:</p>
          <div class="fallback">${resetUrl}</div>
        </div>
        <div class="footer">
          <p>If you did not request a password reset, please ignore this email safely.</p>
          <p>&copy; ${new Date().getFullYear()} WorkSphere. Your Complete Digital Workplace.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const text = `Hi ${name || 'there'},\n\nWe received a request to reset the password for your WorkSphere account. Please visit the following link to set up a new password. This link is single-use and will expire in 15 minutes:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nWorkSphere Team`;

    return await this.sendMail({
      to: email,
      subject,
      html,
      text
    });
  }

  /**
   * Future Templates Compatibility Placeholders
   */
  async sendWelcomeEmail(email, name) {
    logger.info(`Mocking welcome email dispatch for: ${email}`);
    // Future expansion path for welcome notification templates
  }

  async sendLeaveNotification(email, name, leaveDetails) {
    logger.info(`Mocking leave notification email dispatch for: ${email}`);
    // Future expansion path for leave approval/request templates
  }

  async sendTaskAssignmentNotification(email, name, taskDetails) {
    logger.info(`Mocking task assignment email dispatch for: ${email}`);
    // Future expansion for task templates
  }
}

export default new EmailService();
