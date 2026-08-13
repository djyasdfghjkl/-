const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const swaggerJSDoc = require("swagger-jsdoc");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const cors = require("@koa/cors");
const serve = require("koa-static");
const { shouldClearDatabaseOnStartup } = require("./config/startupSafety");

dotenv.config();

const uploadRoot = path.resolve(__dirname, "uploads");
const appStaticRoot = path.resolve(__dirname, "..", "note_view", "static");

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const app = new Koa();

app.use(
  cors({
    origin: (ctx) => ctx.request.header.origin || "*",
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
    maxAge: 86400,
  }),
);

app.use(bodyParser());

const serveUploads = serve(uploadRoot);
const serveAppStatic = serve(appStaticRoot);

app.use(async (ctx, next) => {
  if (ctx.path.startsWith("/static/")) {
    const originalPath = ctx.path;
    ctx.path = ctx.path.replace(/^\/static/, "") || "/";
    await serveAppStatic(ctx, next);
    ctx.path = originalPath;
    return;
  }

  await serveUploads(ctx, next);
});

const logger = require("./middleware/logger");
const rateLimit = require("./middleware/rateLimit");
app.use(logger);
app.use(rateLimit);

app.use(async (ctx, next) => {
  try {
    console.log("[请求]", ctx.method, ctx.url, ctx.request.body);
    await next();

    if (!ctx.body) {
      ctx.body = {
        success: true,
        message: "操作成功",
      };
    }

    if (ctx.body && typeof ctx.body === "object" && !ctx.response.type) {
      ctx.type = "application/json; charset=utf-8";
    }
  } catch (error) {
    console.error("[错误处理中间件] 捕获到错误:", error);
    console.error("[错误堆栈]:", error.stack);

    ctx.status = error.status || 500;
    ctx.type = "application/json; charset=utf-8";
    ctx.body = {
      success: false,
      message: error.message || "服务器内部错误",
    };
  }
});

const mysql = require("./config/mysql");
const mongodb = require("./config/mongodb");

console.log("正在尝试连接 MongoDB...");
const mongodbReady = mongodb.connect();
console.log(process.env.WECHAT_APP_ID, "process.env.WECHAT_APP_ID");

console.log("正在尝试连接 MySQL...");
mysql
  .getConnection()
  .then((connection) => {
    console.log("MySQL connected");
    connection.release();
  })
  .catch((error) => {
    console.error("MySQL connection error:", error.message);
    console.log("服务器将继续启动，即使 MySQL 连接失败");
  });

async function initApp() {
  await mongodbReady;

  const initSuperAdmin = require("./config/init");
  const initDefaultMoods = require("./config/initMoods");
  const initDefaultEmojis = require("./config/initEmojis");
  const { initDefaultMedals } = require("./utils/medalManager");

  await initSuperAdmin();
  await initDefaultMedals();
  await initDefaultMoods();
  await initDefaultEmojis();
}

if (shouldClearDatabaseOnStartup()) {
  console.log("检测到 CLEAR_DATABASE=true，准备清空数据库...");
  const { clearAllDatabases } = require("./config/clearDB");
  clearAllDatabases()
    .then((result) => {
      console.log(result.message);
      return initApp();
    })
    .catch((error) => {
      console.error("清空数据库失败:", error);
    });
} else {
  if (process.env.CLEAR_DATABASE === "true") {
    console.warn(
      "忽略 CLEAR_DATABASE=true。启动清库已禁用，请使用独立的清库脚本和明确确认流程。",
    );
  }
  initApp().catch((error) => {
    console.error("初始化应用失败:", error);
  });
}

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

app.use(async (ctx, next) => {
  if (ctx.path === "/swagger.json" && ctx.method === "GET") {
    ctx.type = "application/json";
    ctx.body = swaggerSpec;
    return;
  }
  await next();
});

app.use(async (ctx, next) => {
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
            dom_id: "#swagger-ui"
          });
        </script>
      </body>
      </html>
    `;
    return;
  }
  await next();
});

const testRouter = require("./routes/test");
const userRouterModule = require("./routes/user");
const rechargeRouterModule = require("./routes/recharge");
const redeemRouterModule = require("./routes/redeem");
const dictionaryRouterModule = require("./routes/dictionary");
const medalRouterModule = require("./routes/medal");
const fileRouterModule = require("./routes/file");
const exportImportRouterModule = require("./routes/export-import");
const diaryRouterModule = require("./routes/diary");
const emojiRouterModule = require("./routes/emoji");
const topicRouterModule = require("./routes/topic");
const adminUserRouterModule = require("./routes/admin-user");
const adminDiaryRouterModule = require("./routes/admin-diary");
const adminBlacklistRouterModule = require("./routes/admin-blacklist");
const caringQuoteRouterModule = require("./routes/caring-quote");
const tagRouterModule = require("./routes/tag");
const notebookRouterModule = require("./routes/notebook");

const squareRouter = require("./routes/square");
const moodRouter = require("./routes/mood");
const adRouter = require("./routes/ad");
const adEarningsRouter = require("./routes/ad-earnings");
const statsRouter = require("./routes/stats");
const analysisRouter = require("./routes/analysis");
const userBlockRouter = require("./routes/user-block");

function registerRoutes(targetApp, routers) {
  routers.filter(Boolean).forEach((router) => {
    targetApp.use(router.routes());
    targetApp.use(router.allowedMethods());
  });
}

registerRoutes(app, [
  testRouter,
  userRouterModule.router,
  userRouterModule.adminRouter,
  userRouterModule.superadminRouter,
  rechargeRouterModule.router,
  rechargeRouterModule.adminRouter,
  redeemRouterModule.router,
  redeemRouterModule.adminRouter,
  dictionaryRouterModule.router,
  dictionaryRouterModule.adminRouter,
  medalRouterModule.router,
  medalRouterModule.adminRouter,
  fileRouterModule.router,
  fileRouterModule.adminRouter,
  exportImportRouterModule.router,
  exportImportRouterModule.adminRouter,
  squareRouter,
  diaryRouterModule.router,
  diaryRouterModule.adminRouter,
  emojiRouterModule.router,
  emojiRouterModule.adminRouter,
  moodRouter,
  topicRouterModule.router,
  topicRouterModule.adminRouter,
  adRouter,
  adEarningsRouter,
  statsRouter,
  analysisRouter,
  userBlockRouter,
  adminUserRouterModule.adminRouter,
  adminDiaryRouterModule.adminRouter,
  adminBlacklistRouterModule.adminRouter,
  caringQuoteRouterModule.adminRouter,
  tagRouterModule.router,
  tagRouterModule.adminRouter,
  notebookRouterModule.router,
  notebookRouterModule.adminRouter,
]);

function startServerWithAutoPort(targetApp, startPort) {
  targetApp
    .listen(startPort, () => {
      console.log("Server running on http://localhost:" + startPort);
      console.log("API docs at http://localhost:" + startPort + "/api-docs");
    })
    .on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.log("端口 " + startPort + " 已被占用，尝试使用端口 " + (startPort + 1));
        startServerWithAutoPort(targetApp, startPort + 1);
      } else {
        console.error("服务器启动失败:", error);
        process.exit(1);
      }
    });
}

module.exports = app;

if (require.main === module) {
  const startPort = parseInt(process.env.PORT, 10) || 3000;
  console.log("准备启动服务器...");
  console.log(`尝试在端口 ${startPort} 启动服务器...`);
  startServerWithAutoPort(app, startPort);
}
