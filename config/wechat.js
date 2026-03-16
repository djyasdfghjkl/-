const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const wechatConfig = {
  appId: process.env.WECHAT_APP_ID || "",
  appSecret: process.env.WECHAT_APP_SECRET || "",
};

// 获取微信小程序的 access_token
const getAccessToken = async () => {
  try {
    const response = await axios.get("https://api.weixin.qq.com/cgi-bin/token", {
      params: {
        grant_type: "client_credential",
        appid: wechatConfig.appId,
        secret: wechatConfig.appSecret,
      },
    });
    return response.data;
  } catch (error) {
    console.error("[微信获取access_token错误]:", error.message);
    throw error;
  }
};

// 获取微信用户信息（通过 code 换取 session_key 和 openid）
const code2Session = async (code) => {
  try {
    const response = await axios.get("https://api.weixin.qq.com/sns/jscode2session", {
      params: {
        appid: wechatConfig.appId,
        secret: wechatConfig.appSecret,
        js_code: code,
        grant_type: "authorization_code",
      },
    });
    return response.data;
  } catch (error) {
    console.error("[微信code2Session错误]:", error.message);
    throw error;
  }
};

// 解密用户数据
const decryptData = (encryptedData, iv, sessionKey) => {
  try {
    const crypto = require("crypto");
    const sessionKeyBuffer = Buffer.from(sessionKey, "base64");
    const ivBuffer = Buffer.from(iv, "base64");
    const encryptedDataBuffer = Buffer.from(encryptedData, "base64");

    const decipher = crypto.createDecipheriv("aes-128-cbc", sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);
    let decoded = decipher.update(encryptedDataBuffer, "base64", "utf8");
    decoded += decipher.final("utf8");

    return JSON.parse(decoded);
  } catch (error) {
    console.error("[微信解密数据错误]:", error.message);
    throw error;
  }
};

module.exports = {
  wechatConfig,
  getAccessToken,
  code2Session,
  decryptData,
};
