import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 465,
    secure: true,
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: `"ArtHub" <${process.env.EMAIL}>`,
    to,
    subject: `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`,
    html: html,
    encoding: 'utf-8'
  };

  // إضافة المرفقات إذا كانت موجودة
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(file => {
      // التأكد من وجود اسم الملف
      const fileName = file.originalName || file.originalname || 'attachment';
      
      // تنظيف اسم الملف من الأحرف الخاصة
      const cleanFileName = fileName.replace(/[^\w\s\-\.]/g, '_');
      
      return {
        filename: `=?UTF-8?B?${Buffer.from(cleanFileName, 'utf-8').toString('base64')}?=`,
        path: file.url,
        contentType: file.type || 'application/octet-stream'
      };
    });
  }

  const emailInfo = await transporter.sendMail(mailOptions);
  return emailInfo.accepted.length < 1 ? false : true;
};
