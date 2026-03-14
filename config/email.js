const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { formatDateTime } = require("../utils/dateUtils");

dotenv.config();

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.qq.com",
  port: process.env.EMAIL_PORT || 465,
  secure: true, // 使用SSL
  auth: {
    user: process.env.EMAIL_USER_NAME || "", // 你的邮箱地址
    pass: process.env.EMAIL_PASSWORD || "", // 你的邮箱密码或授权码
  },
});

// 发送验证码邮件
const sendVerificationEmail = async (email, code, type) => {
  let subject, text, html;

  if (type === "register") {
    subject = "注册验证码";
    text = `您的注册验证码是：${code}，有效期5分钟。`;
    html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>注册验证码</title>
        <style>
          body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background: url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20blue%20gradient%20background%20with%20soft%20waves&image_size=landscape_16_9') no-repeat center center;
            background-size: cover;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.85);
            z-index: 1;
          }
          .content {
            position: relative;
            z-index: 2;
            text-align: center;
          }
          .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 30px;
            border-radius: 50%;
            background: url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20abstract%20logo%20with%20blue%20and%20purple%20colors&image_size=square') no-repeat center center;
            background-size: cover;
            border: 3px solid #ffffff;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          }
          .title {
            font-size: 32px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          }
          .subtitle {
            font-size: 18px;
            color: #666666;
            margin-bottom: 30px;
          }
          .code-container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
          }
          .code-label {
            font-size: 18px;
            color: #666666;
            margin-bottom: 15px;
          }
          .code {
            font-size: 48px;
            font-weight: bold;
            color: #3498db;
            letter-spacing: 5px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          }
          .expiry {
            font-size: 16px;
            color: #999999;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #999999;
            line-height: 1.5;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo"></div>
            <h1 class="title">欢迎注册</h1>
            <p class="subtitle">感谢您选择我们的服务</p>
            <div class="code-container">
              <p class="code-label">您的注册验证码</p>
              <div class="code">${code}</div>
              <p class="expiry">有效期5分钟，请及时使用</p>
            </div>
            <div class="footer">
              <p>如果您没有请求此验证码，请忽略此邮件</p>
              <p>© ${new Date().getFullYear()} 系统服务团队</p>
              <p>发送时间：${formatDateTime(new Date())}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  } else if (type === "reset_password") {
    subject = "密码找回验证码";
    text = `您的密码找回验证码是：${code}，有效期5分钟。`;
    html = `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>密码找回验证码</title>
        <style>
          body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            background: url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=abstract%20purple%20gradient%20background%20with%20soft%20waves&image_size=landscape_16_9') no-repeat center center;
            background-size: cover;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
          }
          .container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.85);
            z-index: 1;
          }
          .content {
            position: relative;
            z-index: 2;
            text-align: center;
          }
          .logo {
            width: 100px;
            height: 100px;
            margin: 0 auto 30px;
            border-radius: 50%;
            background: url('https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20abstract%20logo%20with%20blue%20and%20purple%20colors&image_size=square') no-repeat center center;
            background-size: cover;
            border: 3px solid #ffffff;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
          }
          .title {
            font-size: 32px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
          }
          .subtitle {
            font-size: 18px;
            color: #666666;
            margin-bottom: 30px;
          }
          .code-container {
            background-color: #ffffff;
            border-radius: 10px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
          }
          .code-label {
            font-size: 18px;
            color: #666666;
            margin-bottom: 15px;
          }
          .code {
            font-size: 48px;
            font-weight: bold;
            color: #9b59b6;
            letter-spacing: 5px;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
          }
          .expiry {
            font-size: 16px;
            color: #999999;
            margin-top: 20px;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #999999;
            line-height: 1.5;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo"></div>
            <h1 class="title">密码找回</h1>
            <p class="subtitle">我们收到了您的密码找回请求</p>
            <div class="code-container">
              <p class="code-label">您的密码找回验证码</p>
              <div class="code">${code}</div>
              <p class="expiry">有效期5分钟，请及时使用</p>
            </div>
            <div class="footer">
              <p>如果您没有请求找回密码，请忽略此邮件</p>
              <p>© ${new Date().getFullYear()} 系统服务团队</p>
              <p>发送时间：${formatDateTime(new Date())}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER_NAME,
      to: email,
      subject: subject,
      text: text,
      html: html,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = { sendVerificationEmail };
