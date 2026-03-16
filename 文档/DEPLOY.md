# Vercel 部署指南

## 准备工作

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 Vercel 控制台中，添加以下环境变量：

- `PORT` - 服务器端口（Vercel 会自动分配）
- `MYSQL_HOST` - MySQL 数据库主机地址
- `MYSQL_USER` - MySQL 数据库用户名
- `MYSQL_PASSWORD` - MySQL 数据库密码
- `MYSQL_DATABASE` - MySQL 数据库名称
- `MONGODB_URI` - MongoDB 连接字符串
- `REDIS_URL` - Redis 连接字符串
- `EMAIL_USER_NAME` - 邮箱用户名
- `EMAIL_PASSWORD` - 邮箱密码
- `EMAIL_HOST` - 邮箱 SMTP 服务器
- `CLEAR_DATABASE` - 是否清空数据库（设置为 false）

### 3. 部署到 Vercel

1. 登录 Vercel 控制台
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. 点击 "Import"
5. 在 "Build & Development Settings" 中：
   - Framework Preset: `Other`
   - Build Command: `npm install`
   - Output Directory: 留空
   - Root Directory: 留空
6. 点击 "Deploy"

## 注意事项

- Vercel 是一个无服务器平台，它会频繁地启动和停止服务器实例
- 数据库连接可能会在服务器启动时失败，但服务器会继续运行
- 当需要访问数据库时，服务器会尝试重新连接
- 确保使用外部的数据库服务，因为 Vercel 不支持在其服务器上运行数据库

## 测试部署

部署完成后，你可以通过 Vercel 提供的 URL 访问你的 API。API 文档可以通过 `/api-docs` 路径访问。