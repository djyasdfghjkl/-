// 使用内存存储访问记录
const rateLimitStore = new Map();

// 反爬中间件配置
const RATE_LIMIT_OPTIONS = {
  maxRequests: 100, // 1分钟内最多100次请求
  timeWindow: 60, // 时间窗口，单位秒
  warningThreshold: 80, // 超过80次请求时发出警告
};

// 反爬中间件
const rateLimit = async (ctx, next) => {
  try {
    // 获取用户IP地址
    const ip = ctx.ip || (ctx.ips && ctx.ips[0]) || "unknown";

    const now = Date.now();
    const windowStart = now - RATE_LIMIT_OPTIONS.timeWindow * 1000;

    // 获取该IP的访问记录
    let ipRecords = rateLimitStore.get(ip) || [];

    // 过滤掉时间窗口外的记录
    ipRecords = ipRecords.filter(function (timestamp) {
      return timestamp > windowStart;
    });

    // 检查是否超过限制
    if (ipRecords.length >= RATE_LIMIT_OPTIONS.maxRequests) {
      ctx.status = 429;
      ctx.body = {
        success: false,
        message: "请求过于频繁，请稍后再试",
      };
      return;
    }

    // 增加访问记录
    ipRecords.push(now);

    // 保存更新后的记录
    rateLimitStore.set(ip, ipRecords);

    // 如果接近限制，添加警告头
    if (ipRecords.length >= RATE_LIMIT_OPTIONS.warningThreshold) {
      ctx.set(
        "X-RateLimit-Warning",
        "You are approaching the rate limit (" +
          ipRecords.length +
          "/" +
          RATE_LIMIT_OPTIONS.maxRequests +
          ")",
      );
    }

    // 添加速率限制相关头
    ctx.set("X-RateLimit-Limit", RATE_LIMIT_OPTIONS.maxRequests);
    ctx.set(
      "X-RateLimit-Remaining",
      RATE_LIMIT_OPTIONS.maxRequests - ipRecords.length,
    );

    // 继续处理请求
    await next();
  } catch (error) {
    console.error("速率限制中间件错误:", error);
    // 发生错误时，允许请求继续
    await next();
  }
};

module.exports = rateLimit;
