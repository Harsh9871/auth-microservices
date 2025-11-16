import fetch from 'node-fetch';

class EmailService {
  constructor() {
    this.mailServiceUrl = process.env.MAIL_MICROSERVICE_URL;
    this.appName = process.env.APP_NAME || 'Auth Service';
  }

  async sendOTP(email, otp, userName = 'User') {
    try {
      const subject = `Email Verification - ${this.appName}`;
      const html = this.generateVerificationEmail(otp, userName);
      const text = `Your verification code is: ${otp}. It will expire in 10 minutes.`;

      const response = await fetch(`${this.mailServiceUrl}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          text: text,
          html: html
        })
      });

      const result = await response.json();

      if (!result.success) {
        console.error('Email service error:', result.error);
        return false;
      }

      console.log('OTP email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  generateVerificationEmail(otp, userName) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; }
          .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            text-align: center; 
            color: #007bff;
            margin: 20px 0;
          }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            <p>Please use the following OTP code to verify your email address:</p>
            <div class="otp-code">${otp}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default new EmailService();