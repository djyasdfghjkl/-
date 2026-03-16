const ngrok = require('@ngrok/ngrok');
const app = require('./index');
const http = require('http');

// 启动HTTP服务器
const PORT = process.env.PORT || 3000;
const server = http.createServer(app.callback());

server.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API文档在 http://localhost:${PORT}/api-docs`);
  
  try {
    // 连接到ngrok
    const listener = await ngrok.connect({
      addr: PORT,
      authtoken_from_env: true
    });
    
    console.log(`\n=== ngrok 隧道已建立 ===`);
    console.log(`公网访问地址: ${listener.url()}`);
    console.log(`API文档公网地址: ${listener.url()}/api-docs`);
    console.log(`====================`);
    
  } catch (error) {
    console.error('ngrok连接失败:', error);
    process.exit(1);
  }
});

// 处理服务器错误
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${PORT} 已被占用`);
  } else {
    console.error('服务器启动失败:', error);
  }
  process.exit(1);
});