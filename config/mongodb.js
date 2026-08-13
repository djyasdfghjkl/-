const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { shouldUseMongoFallback } = require("./startupSafety");

dotenv.config();

const FALLBACK_DB_PATH = path.resolve(__dirname, "..", "..", "mongo-data", "runtime-db");
const DEFAULT_CONNECT_RETRIES = Number(process.env.MONGODB_CONNECT_RETRIES || 8);

const isConnected = () => mongoose.connection.readyState === 1;

let mongod = null;
let connectPromise = null;

const ensureDir = (targetPath) => {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectWithUri = async (uri) => {
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
};

const connectWithRetry = async (uri, attempts = DEFAULT_CONNECT_RETRIES) => {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await connectWithUri(uri);
      return true;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB 连接失败 (${attempt}/${attempts}):`, error.message);
      if (attempt < attempts) {
        await sleep(Math.min(1000 * attempt, 5000));
      }
    }
  }

  throw lastError;
};

const connect = async () => {
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    const configuredUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/note";

    try {
      await connectWithRetry(configuredUri);
      console.log("MongoDB connected");
      return true;
    } catch (error) {
      if (!shouldUseMongoFallback()) {
        console.error("MongoDB connection error:", error.message);
        console.error(
          "MongoDB fallback is disabled. Set MONGODB_FALLBACK=true only for explicit local development fallback.",
        );
        return false;
      }
      console.error("MongoDB connection error:", error.message);
      console.log("尝试启动本地持久化 MongoDB 实例...");
    }

    try {
      ensureDir(FALLBACK_DB_PATH);
      const { MongoMemoryServer } = require("mongodb-memory-server");
      mongod = await MongoMemoryServer.create({
        instance: {
          dbName: "note",
          dbPath: FALLBACK_DB_PATH,
          storageEngine: "wiredTiger",
        },
      });

      const uri = mongod.getUri("note");
      console.log("本地持久化 MongoDB 已启动:", uri);

      await connectWithUri(uri);
      console.log("已连接到本地持久化 MongoDB");
      return true;
    } catch (memError) {
      console.error("本地持久化 MongoDB 启动失败:", memError.message);
      console.log("服务器将继续运行，但 MongoDB 功能不可用");
      return false;
    }
  })();

  return connectPromise;
};

process.on("SIGINT", async () => {
  try {
    if (mongod) {
      await mongod.stop({ doCleanup: false, force: false });
      console.log("本地持久化 MongoDB 已停止");
    }
  } catch (error) {
    console.error("停止本地持久化 MongoDB 失败:", error.message);
  }
  process.exit(0);
});

module.exports = { connect, isConnected };
