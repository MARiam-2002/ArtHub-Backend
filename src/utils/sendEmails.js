import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,           // ايميلك
      pass: process.env.EMAIL_PASSWORD   // app password من Gmail
    }
  });

  const mailOptions = {
    from: `"ArtHub" <${process.env.EMAIL}>`,
    to,
    subject,   // خليه عادي، Gmail بيتعامل مع UTF-8 لوحده
    html
  };

  // المرفقات (لو فيه)
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(file => ({
      filename: file.originalName || file.originalname || 'attachment',
      path: file.url,
      contentType: file.type || 'application/octet-stream'
    }));
  }

  const emailInfo = await transporter.sendMail(mailOptions);
  return emailInfo.accepted.length > 0;
};
