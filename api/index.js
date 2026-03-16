const serverless = require("serverless-http");
const app = require("../index"); // 你的koa入口

module.exports = serverless(app);