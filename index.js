const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const Router = require("koa-router");
const swaggerJSDoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
const fs = require("fs");

// 加载环境变量
dotenv.config();

// 创建上传目录（如果不存在）
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 初始化Koa应用
const app = new Koa();

// CORS中间件
const cors = require("@koa/cors");
app.use(
  cors({
    origin: (ctx) => {
      // 允许所有来源，或者根据需要配置白名单
      const origin = ctx.request.header.origin;
      return origin || "*";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
      "Referer",
      "User-Agent",
      "X-Requested-With",
    ],
    exposeHeaders: ["Authorization"],
    credentials: true,
    maxAge: 86400, // 24小时
  }),
);

// 中间件
app.use(bodyParser());

// 提供上传文件的静态资源服务
const serve = require("koa-static");
app.use(serve(uploadDir));

// 请求日志中间件
const logger = require("./middleware/logger");
app.use(logger);

// 反爬中间件
const rateLimit = require("./middleware/rateLimit");
app.use(rateLimit);

// 错误处理中间件
app.use(async function (ctx, next) {
  try {
    // 记录请求
    console.log("[请求]", ctx.method, ctx.url, ctx.request.body);

    // 执行后续中间件
    await next();

    // 确保返回体有内容
    if (!ctx.body) {
      ctx.body = {
        success: true,
        message: "操作成功",
      };
    }
  } catch (error) {
    console.error("[错误处理中间件] 捕获到错误:", error);
    console.error("[错误处理中间件] 错误堆栈:", error.stack);

    // 确保返回体有内容
    ctx.body = {
      success: false,
      message: error.message || "服务器内部错误",
    };

    // 设置状态码
    ctx.status = error.status || 500;
  }
});

// 数据库连接
const mysql = require("./config/mysql");
const mongodb = require("./config/mongodb");

// 初始化MongoDB连接
console.log("正在尝试连接MongoDB...");
mongodb.connect();
console.log(process.env.WECHAT_APP_ID, "process.env.WECHAT_APP_ID");

// 测试MySQL连接
console.log("正在尝试连接MySQL...");
mysql
  .getConnection()
  .then((connection) => {
    console.log("MySQL connected");
    connection.release();
  })
  .catch((error) => {
    console.error("MySQL connection error:", error.message);
    console.log("服务器将继续启动，即使MySQL连接失败");
  });

// 检查是否需要清空数据库
if (process.env.CLEAR_DATABASE === "true") {
  console.log("检测到CLEAR_DATABASE=true，准备清空数据库...");
  const { clearAllDatabases } = require("./config/clearDB");
  clearAllDatabases().then((result) => {
    console.log(result.message);
    // 数据库清空后重新初始化
    initApp();
  });
} else {
  // 正常初始化应用
  initApp();
}

// 初始化应用函数
function initApp() {
  // 初始化超级管理员账号
    const initSuperAdmin = require("./config/init");
    initSuperAdmin();

    // 初始化默认勋章
    const { initDefaultMedals } = require("./utils/medalManager");
    initDefaultMedals();

    // 初始化默认心情
    const initDefaultMoods = require("./config/initMoods");
    initDefaultMoods();
}

// Swagger配置
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Koa API Documentation",
      version: "1.0.0",
      description: "A simple Koa backend API",
    },
    servers: [
      {
        url: "http://localhost:" + (process.env.PORT || 3000),
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Swagger JSON端点
app.use(function (ctx, next) {
  if (ctx.path === "/swagger.json" && ctx.method === "GET") {
    ctx.type = "application/json";
    ctx.body = swaggerSpec;
  } else {
    return next();
  }
});

// Swagger UI端点
app.use(function (ctx, next) {
  if (ctx.path === "/api-docs" && ctx.method === "GET") {
    ctx.type = "text/html";
    ctx.body = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: "/swagger.json",
            dom_id: '#swagger-ui'
          });
        </script>
      </body>
      </html>
    `;
  } else {
    return next();
  }
});

// 路由
const testRouter = require("./routes/test");
const userRouterModule = require("./routes/user");
const userRouter = userRouterModule.router;
const userAdminRouter = userRouterModule.adminRouter;
const userSuperadminRouter = userRouterModule.superadminRouter;
const rechargeRouterModule = require("./routes/recharge");
const rechargeRouter = rechargeRouterModule.router;
const rechargeAdminRouter = rechargeRouterModule.adminRouter;
const redeemRouterModule = require("./routes/redeem");
const redeemRouter = redeemRouterModule.router;
const redeemAdminRouter = redeemRouterModule.adminRouter;
const dictionaryRouterModule = require("./routes/dictionary");
const dictionaryRouter = dictionaryRouterModule.router;
const dictionaryAdminRouter = dictionaryRouterModule.adminRouter;
const medalRouterModule = require("./routes/medal");
const medalRouter = medalRouterModule.router;
const medalAdminRouter = medalRouterModule.adminRouter;
const fileRouterModule = require("./routes/file");
const fileRouter = fileRouterModule.router;
const fileAdminRouter = fileRouterModule.adminRouter;
const exportImportRouterModule = require("./routes/export-import");
const exportImportRouter = exportImportRouterModule.router;
const exportImportAdminRouter = exportImportRouterModule.adminRouter;
const squareRouter = require("./routes/square");
const diaryRouterModule = require("./routes/diary");
const diaryRouter = diaryRouterModule.router;
const diaryAdminRouter = diaryRouterModule.adminRouter;
const emojiRouterModule = require("./routes/emoji");
const emojiRouter = emojiRouterModule.router;
const emojiAdminRouter = emojiRouterModule.adminRouter;
const moodRouter = require("./routes/mood");
const topicRouterModule = require("./routes/topic");
const topicRouter = topicRouterModule.router;
const topicAdminRouter = topicRouterModule.adminRouter;
const adRouter = require("./routes/ad");
const adEarningsRouter = require("./routes/ad-earnings");
const statsRouter = require("./routes/stats");
const analysisRouter = require("./routes/analysis");

// 注册路由的函数
function registerRoutes(app, routers) {
  routers.forEach((router) => {
    app.use(router.routes());
    app.use(router.allowedMethods());
  });
}

// 注册所有路由
registerRoutes(app, [
  testRouter,
  userRouter,
  userAdminRouter,
  userSuperadminRouter,
  rechargeRouter,
  rechargeAdminRouter,
  redeemRouter,
  redeemAdminRouter,
  dictionaryRouter,
  dictionaryAdminRouter,
  medalRouter,
  medalAdminRouter,
  fileRouter,
  fileAdminRouter,
  exportImportRouter,
  exportImportAdminRouter,
  squareRouter,
  diaryRouter,
  diaryAdminRouter,
  emojiRouter,
  emojiAdminRouter,
  moodRouter,
  topicRouter,
  topicAdminRouter,
  adRouter,
  adEarningsRouter,
  statsRouter,
  analysisRouter,
]);

// 端口自动递增函数
function startServerWithAutoPort(app, startPort) {
  app
    .listen(startPort, function () {
      console.log("Server running on http://localhost:" + startPort);
      console.log("API docs at http://localhost:" + startPort + "/api-docs");
    })
    .on("error", function (error) {
      if (error.code === "EADDRINUSE") {
        console.log(
          "端口 " + startPort + " 已被占用，尝试使用端口 " + (startPort + 1),
        );
        // 端口被占用，自动尝试下一个端口
        startServerWithAutoPort(app, startPort + 1);
      } else {
        console.error("服务器启动失败:", error);
        process.exit(1);
      }
    });
}

// 导出app对象供serverless-http使用
module.exports = app;

// 在本地运行时启动服务器
if (require.main === module) {
  // 启动服务器（自动递增端口）
  const startPort = parseInt(process.env.PORT) || 3000;
  console.log("准备启动服务器...");
  console.log(`尝试在端口 ${startPort} 启动服务器...`);
  startServerWithAutoPort(app, startPort);
}
