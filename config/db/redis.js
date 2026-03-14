const redis = require("redis");
const dotenv = require("dotenv");

dotenv.config();

// 使用 redis@3.x 的回调 API
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
});

redisClient.on("connect", () => {
  console.log("Redis connected");
});

redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

module.exports = redisClient;
