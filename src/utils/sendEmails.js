import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ to, subject, html, attachments }) => {
  try {
    const options = {
      from: `ArtHub <no-reply@arthubsa.com>`,
      to,
      subject,
      html,
    };

    // إضافة المرفقات لو موجودة
    if (attachments && attachments.length > 0) {
      options.attachments = attachments.map(file => {
        const fileName = file.originalName || file.originalname || 'attachment';
        const cleanFileName = fileName.replace(/[^\w\s\-\.]/g, '_');

        return {
          filename: cleanFileName,
          path: file.url, // Resend بيقبل URL مباشر أو Base64
        };
      });
    }

    const { data, error } = await resend.emails.send(options);

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    console.log('Email sent:', data);
    return true;
  } catch (err) {
    console.error('Unexpected Error:', err);
    return false;
  }
};
