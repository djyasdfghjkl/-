const RequestLog = require('../models/RequestLog');
const fs = require('fs');
const path = require('path');

// 确保logs目录存在
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 简单日志写入函数
function writeLog(logEntry) {
  const logFile = path.join(
    logsDir,
    `requests-${new Date().toISOString().slice(0, 10)}.log`
  );
  const logLine = JSON.stringify(logEntry) + '\n';
  fs.appendFile(logFile, logLine, (err) => {
    if (err) console.error('日志写入失败:', err);
  });
}

// 获取真实IP（考虑代理）
function getClientIp(ctx) {
  const forwarded = ctx.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return ctx.ip || (ctx.ips && ctx.ips[0]) || 'unknown';
}

// 脱敏处理请求体
function sanitizeBody(body) {
  if (!body) return {};
  try {
    const sanitized = JSON.parse(JSON.stringify(body));
    // 脱敏处理敏感字段
    if (sanitized.password) {
      sanitized.password = '***';
    }
    if (sanitized.newPassword) {
      sanitized.newPassword = '***';
    }
    if (sanitized.code) {
      sanitized.code = '***';
    }
    if (sanitized.token) {
      sanitized.token = '***';
    }
    if (sanitized.authorization) {
      sanitized.authorization = '***';
    }
    return sanitized;
  } catch (error) {
    return { message: '[Recorded]' };
  }
}

// 脱敏处理请求头
function sanitizeHeaders(headers) {
  if (!headers) return {};
  const sanitized = JSON.parse(JSON.stringify(headers));
  // 脱敏处理敏感头信息
  if (sanitized.authorization) {
    sanitized.authorization = '***';
  }
  if (sanitized['x-api-key']) {
    sanitized['x-api-key'] = '***';
  }
  return sanitized;
}

// 请求日志记录中间件
const logger = async (ctx, next) => {
  const startTime = Date.now();
  const req = ctx.request;
  const res = ctx.response;
  
  // 准备日志数据
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    referer: req.headers.referer || req.headers.referrer || '',
    user_agent: req.headers['user-agent'] || '',
    ip: getClientIp(ctx),
    host: req.headers.host || '',
    query: req.query || {},
    body: req.method === 'POST' ? sanitizeBody(req.body) : {},
    headers: sanitizeHeaders(req.headers),
    user_id: (ctx.state.user && ctx.state.user._id) ? ctx.state.user._id.toString() : null,
    user_role: (ctx.state.user && ctx.state.user.role) || null,
    session_id: ctx.session ? ctx.session.id : null,
    response: {
      status: null,
      headers: {},
      size: null
    },
    error: null,
    response_time: null
  };
  
  try {
    await next();
    
    // 记录响应信息
    logEntry.response.status = res.status;
    logEntry.response.headers = sanitizeHeaders(res.headers);
    logEntry.response.size = res.length || null;
    logEntry.response_time = Date.now() - startTime;
  } catch (error) {
    // 记录错误信息
    logEntry.response.status = error.status || 500;
    logEntry.response_time = Date.now() - startTime;
    logEntry.error = {
      message: error.message,
      stack: error.stack ? error.stack.substring(0, 500) : null, // 限制堆栈长度
      status: error.status || 500
    };
    
    throw error; // 重新抛出错误，让错误处理中间件处理
  } finally {
    // 异步写入文件日志
    setImmediate(() => {
      writeLog(logEntry);
    });
    
    // 异步保存到数据库
    setImmediate(async () => {
      try {
        const log = new RequestLog({
          timestamp: new Date(logEntry.timestamp),
          method: logEntry.method,
          url: logEntry.url,
          referer: logEntry.referer,
          userAgent: logEntry.user_agent,
          ip: logEntry.ip,
          host: logEntry.host,
          query: JSON.stringify(logEntry.query),
          body: JSON.stringify(logEntry.body),
          userId: logEntry.user_id,
          sessionId: logEntry.session_id,
          statusCode: logEntry.response.status,
          responseTime: logEntry.response_time,
          responseSize: logEntry.response.size,
          error: logEntry.error ? JSON.stringify(logEntry.error) : null
        });
        await log.save();
      } catch (error) {
        // 日志记录失败不影响业务流程
        console.error('数据库日志记录失败:', error.message);
      }
    });
  }
};

module.exports = logger;