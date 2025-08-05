export const signupTemp = link => `<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
<style type="text/css">
body{background-color: #88BDBF;margin: 0px;}
</style>
<body style="margin:0px;"> 
<table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
<tr>
<td>
<table border="0" width="100%">
<tr>
<td>
<h1>
    <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
</h1>
</td>
<td>
<p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td>
<table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
<tr>
<td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
<img width="50px" height="50px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png">
</td>
</tr>
<tr>
<td>
<h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
</td>
</tr>
<tr>
<td>
<p style="padding:0px 100px;">
</p>
</td>
</tr>
<tr>
<td>
<a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td>
<table border="0" width="100%" style="border-radius: 5px;text-align: center;">
<tr>
<td>
<h3 style="margin-top:10px; color:#000">Stay in touch</h3>
</td>
</tr>
<tr>
<td>
<div style="margin-top:20px;">

<a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
<img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>

<a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
<img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
</a>

<a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
<img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
</a>

</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

export const resetPassword = (userName, code) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>إعادة تعيين كلمة المرور</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
        body {
            margin: 0;
            padding: 0;
            background-color: #F1F7FF;
            font-family: 'Tajawal', sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #C1D1E6;
            padding: 20px;
            text-align: center;
        }
        .header img {
            max-width: 150px;
        }
        .content {
            padding: 40px;
            color: #4B4B4B;
            line-height: 1.8;
            text-align: right;
        }
        .content h1 {
            color: #112B47;
            font-size: 24px;
        }
        .code-container {
            background-color: #EAF3FF;
            border: 1px dashed #C1D1E6;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
        }
        .code {
            font-size: 36px;
            font-weight: 700;
            color: #112B47;
            letter-spacing: 10px;
        }
        .footer {
            background-color: #C1D1E6;
            padding: 20px;
            text-align: center;
            color: #112B47;
            font-size: 14px;
        }
        .footer a {
            color: #112B47;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dgzucjqgi/image/upload/v1746479874/ArtHub-06_2_kjeduf.png" alt="ArtHub Logo">
        </div>
        <div class="content">
            <h1>مرحباً ${userName}</h1>
            <p>.لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك. استخدم الرمز أدناه للمتابعة</p>
            <div class="code-container">
                <p style="margin:0; font-size: 16px;">:رمز التحقق الخاص بك هو</p>
                <p class="code">${code}</p>
            </div>
            <p>.إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذا البريد الإلكتروني بأمان</p>
            <p>,شكرًا لك<br> ArtHub فريق</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 ArtHub. جميع الحقوق محفوظة</p>
            <p>إذا كنت بحاجة إلى مساعدة، <a href="mailto:support@arthub.com">تواصل مع الدعم الفني</a>.</p>
        </div>
    </div>
</body>
</html>`;

export const adminMessageEmail = (subject, message, attachments = []) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject || 'رسالة من إدارة المنصة'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
        body {
            margin: 0;
            padding: 0;
            background-color: #F1F7FF;
            font-family: 'Tajawal', sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
            background-color: #C1D1E6;
            padding: 20px;
            text-align: center;
        }
        .header img {
            max-width: 150px;
        }
        .content {
            padding: 40px;
            color: #4B4B4B;
            line-height: 1.8;
            text-align: right;
        }
        .content h1 {
            color: #112B47;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .message-content {
            background-color: #EAF3FF;
            border: 1px dashed #C1D1E6;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
            text-align: right;
        }
        .message-content p {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #112B47;
            line-height: 1.6;
        }
        .message-content p:last-child {
            margin-bottom: 0;
        }
        .attachments-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #C1D1E6;
        }
        .attachments-title {
            color: #112B47;
            font-size: 18px;
            margin-bottom: 15px;
        }
        .attachment-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            background-color: #F8FBFF;
            border-radius: 6px;
            border: 1px solid #E1E8F0;
        }
        .attachment-icon {
            margin-left: 10px;
            color: #6B7280;
        }
        .attachment-link {
            color: #2563EB;
            text-decoration: none;
            font-weight: 500;
        }
        .attachment-link:hover {
            text-decoration: underline;
        }
        .footer {
            background-color: #C1D1E6;
            padding: 20px;
            text-align: center;
            color: #112B47;
            font-size: 14px;
        }
        .footer a {
            color: #112B47;
            text-decoration: none;
        }
        .disclaimer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #E1E8F0;
            text-align: center;
            color: #6B7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://res.cloudinary.com/dgzucjqgi/image/upload/v1746479874/ArtHub-06_2_kjeduf.png" alt="ArtHub Logo">
        </div>
        <div class="content">
            <h1>${subject || 'رسالة من إدارة المنصة'}</h1>
            <div class="message-content">
                ${message}
            </div>
            ${attachments && attachments.length > 0 ? `
                <div class="attachments-section">
                    <h3 class="attachments-title">المرفقات:</h3>
                    ${attachments.map(file => `
                        <div class="attachment-item">
                            <span class="attachment-icon">📎</span>
                            <a href="${file.url}" class="attachment-link" target="_blank">
                                ${file.originalName || 'ملف مرفق'}
                            </a>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            <div class="disclaimer">
                <p>هذه الرسالة من إدارة منصة ArtHub</p>
                <p>يرجى عدم الرد على هذا البريد الإلكتروني</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2024 ArtHub. جميع الحقوق محفوظة</p>
            <p>إذا كنت بحاجة إلى مساعدة، <a href="mailto:support@arthub.com">تواصل مع الدعم الفني</a>.</p>
        </div>
    </div>
</body>
</html>`;
