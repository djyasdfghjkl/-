// 错误处理中间件
const errorHandler = async (ctx, next) => {
  try {
    // 记录请求
    console.log('[请求]', ctx.method, ctx.url, ctx.request.body);
    
    // 执行后续中间件
    await next();
    
    // 确保返回体有内容
    if (!ctx.body) {
      ctx.body = {
        success: true,
        message: '操作成功'
      };
    }
  } catch (error) {
    console.error('[错误处理中间件] 捕获到错误:', error);
    console.error('[错误处理中间件] 错误堆栈:', error.stack);
    
    // 确保返回体有内容
    ctx.body = {
      success: false,
      message: error.message || '服务器内部错误'
    };
    
    // 设置状态码
    ctx.status = error.status || 500;
  }
};

module.exports = errorHandler;