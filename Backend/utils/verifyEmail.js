const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Utility script to verify email configuration
 * Run with: node utils/verifyEmail.js
 */

async function verifyEmailConfig() {
  console.log('Verifying email configuration...');
  
  const EMAIL = process.env.NODEMAILER_EMAIL;
  const PASSWORD = process.env.NODEMAILER_PASSWORD;
  
  if (!EMAIL || !PASSWORD) {
    console.error('❌ ERROR: Missing email credentials in environment variables');
    console.log('Please ensure NODEMAILER_EMAIL and NODEMAILER_PASSWORD are set in your .env file');
    return false;
  }
  
  console.log(`📧 Using email: ${EMAIL}`);
  
  try {
    // Create test transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email configuration is valid! SMTP connection successful.');
    
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n📝 TROUBLESHOOTING:');
      console.log('1. Make sure your email and password are correct');
      console.log('2. If using Gmail, enable "Less secure app access" or');
      console.log('3. Create an App Password (recommended): https://myaccount.google.com/apppasswords');
    }
    
    return false;
  }
}

// Run verification if script is executed directly
if (require.main === module) {
  verifyEmailConfig();
}

module.exports = verifyEmailConfig; 