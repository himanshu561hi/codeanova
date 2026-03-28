const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or another service like sendgrid depending on user env
  auth: {
    user: process.env.EMAIL_USER || 'codeanova26@gmail.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
});

exports.sendEmail = async (to, subject, htmlContent, attachments = []) => {
  try {
    const mailOptions = {
      from: `"Code-A-Nova Team" <${process.env.EMAIL_USER || 'codeanova26@gmail.com'}>`,
      to,
      subject,
      html: htmlContent,
      attachments,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};
