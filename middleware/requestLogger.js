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
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
}

// 脱敏处理请求体
function sanitizeBody(body) {
  if (!body) return '';
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
    return JSON.stringify(sanitized);
  } catch (error) {
    return '[Recorded]';
  }
}

// Koa日志中间件
function requestLogger(ctx, next) {
  const startTime = Date.now();
  const req = ctx.request;
  const res = ctx.response;

  // 记录请求基础信息
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl || req.url,
    referer: req.headers.referer || req.headers.referrer || '',
    user_agent: req.headers['user-agent'] || '',
    ip: getClientIp(req),
    host: req.headers.host || '',
    query: JSON.stringify(req.query || {}),
    body: req.method === 'POST' ? sanitizeBody(req.body) : '',
    user_id: ctx.state.user ? ctx.state.user._id.toString() : null,
    session_id: ctx.session ? ctx.session.id : null,
  };

  // 监听响应结束，记录耗时和状态码
  return next().then(() => {
    const duration = Date.now() - startTime;
    logEntry.status = res.status;
    logEntry.duration_ms = duration;
    logEntry.response_size = res.length || null;

    // 异步写入（避免阻塞）
    setImmediate(() => {
      writeLog(logEntry);
    });
  }).catch((error) => {
    const duration = Date.now() - startTime;
    logEntry.status = 500;
    logEntry.duration_ms = duration;
    logEntry.error = error.message;

    // 异步写入（避免阻塞）
    setImmediate(() => {
      writeLog(logEntry);
    });

    throw error;
  });
}

module.exports = requestLogger;