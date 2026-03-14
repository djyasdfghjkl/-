const path = require('path');
const fs = require('fs');
const swaggerUiDist = require('swagger-ui-dist');

const swaggerUiPath = swaggerUiDist.absolutePath();

// 读取 swagger-ui 入口文件
const indexHtmlPath = path.join(swaggerUiPath, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 修改 swagger-ui 配置，指向我们的 swagger.json
indexHtml = indexHtml.replace(
  'url: "./swagger.json",',
  'url: "/swagger.json",'
);

// 自定义 swagger UI 中间件
const swaggerUI = {
  serve: async (ctx, next) => {
    await next();
  },
  setup: (swaggerSpec) => {
    const router = require('@koa/router')();
    
    // 提供 swagger.json
    router.get('/swagger.json', (ctx) => {
      ctx.type = 'application/json';
      ctx.body = swaggerSpec;
    });
    
    // 提供 swagger-ui 静态文件
    router.get('/api-docs', (ctx) => {
      ctx.type = 'text/html';
      ctx.body = indexHtml;
    });
    
    // 提供 swagger-ui 静态资源
    router.get('/api-docs/(.*)', (ctx) => {
      const file = ctx.params[0] || 'index.html';
      const filePath = path.join(swaggerUiPath, file);
      try {
        ctx.type = path.extname(file);
        ctx.body = fs.createReadStream(filePath);
      } catch (error) {
        ctx.status = 404;
        ctx.body = 'File not found';
      }
    });
    
    return router.routes();
  }
};

module.exports = swaggerUI;