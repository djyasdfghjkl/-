# 项目部署指南

## 项目概述

这是一个基于 Koa.js 的后端项目，使用 MySQL、MongoDB 和 Redis 作为数据存储。项目提供了用户管理、日记管理、广场、勋章等功能的 API 接口。

## 依赖项

项目依赖以下技术栈：

- Node.js (v14+)
- Koa.js
- MySQL
- MongoDB
- Redis
- 其他依赖项见 package.json

## 数据库配置

### 1. MySQL 数据库

#### 本地开发配置

1. 安装 MySQL 数据库
2. 创建数据库 `note`
3. 在 `.env` 文件中配置以下环境变量：

```env
# MySQL 数据库配置
MYSQL_HOST=localhost
MYSQL_USER=admin
MYSQL_PASSWORD=123456
MYSQL_DATABASE=note
```

#### 生产环境配置

在生产环境中，建议使用云服务提供商的 MySQL 服务，如：
- Amazon RDS
- Google Cloud SQL
- Azure Database for MySQL
- 阿里云 RDS

然后在环境变量中配置相应的连接信息。

### 2. MongoDB 数据库

#### 本地开发配置

1. 安装 MongoDB 数据库
2. 在 `.env` 文件中配置以下环境变量：

```env
# MongoDB 数据库配置
MONGODB_URI=mongodb://localhost:27017/note
```

#### 生产环境配置

在生产环境中，建议使用云服务提供商的 MongoDB 服务，如：
- MongoDB Atlas
- Amazon DocumentDB
- Google Cloud MongoDB
- 阿里云 MongoDB

然后在环境变量中配置相应的连接字符串。

### 3. Redis 数据库

#### 本地开发配置

1. 安装 Redis 数据库
2. 在 `.env` 文件中配置以下环境变量：

```env
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### 生产环境配置

在生产环境中，建议使用云服务提供商的 Redis 服务，如：
- Redis Labs
- Amazon ElastiCache
- Google Cloud Memorystore
- 阿里云 Redis

然后在环境变量中配置相应的连接信息。

## 本地部署

### 1. 克隆项目

```bash
git clone <项目仓库地址>
cd <项目目录>
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`，并根据实际情况修改配置：

```bash
cp .env.example .env
# 编辑 .env 文件
```

### 4. 启动数据库服务

确保 MySQL、MongoDB 和 Redis 服务已经启动。

### 5. 启动项目

```bash
# 开发模式（使用 nodemon）
npm run dev

# 生产模式
npm start
```

### 6. 访问 API 文档

项目启动后，可以通过以下地址访问 API 文档：

```
http://localhost:<端口>/api-docs
```

## Vercel 部署

### 1. 准备工作

1. 确保项目已经推送到 GitHub 仓库
2. 注册 Vercel 账号并登录

### 2. 配置环境变量

在 Vercel 控制台中，添加以下环境变量：

- `PORT` - 服务器端口（Vercel 会自动分配）
- `MYSQL_HOST` - MySQL 数据库主机地址
- `MYSQL_USER` - MySQL 数据库用户名
- `MYSQL_PASSWORD` - MySQL 数据库密码
- `MYSQL_DATABASE` - MySQL 数据库名称
- `MONGODB_URI` - MongoDB 连接字符串
- `REDIS_HOST` - Redis 主机地址
- `REDIS_PORT` - Redis 端口
- `REDIS_PASSWORD` - Redis 密码
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

### 4. 验证部署

部署完成后，Vercel 会提供一个 URL，你可以通过该 URL 访问你的 API。API 文档可以通过 `/api-docs` 路径访问。

## Docker 部署

### 1. 创建 Dockerfile

在项目根目录创建 `Dockerfile` 文件：

```dockerfile
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. 创建 docker-compose.yml

在项目根目录创建 `docker-compose.yml` 文件：

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - MYSQL_HOST=mysql
      - MYSQL_USER=admin
      - MYSQL_PASSWORD=123456
      - MYSQL_DATABASE=note
      - MONGODB_URI=mongodb://mongodb:27017/note
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=
    depends_on:
      - mysql
      - mongodb
      - redis

  mysql:
    image: mysql:5.7
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_USER=admin
      - MYSQL_PASSWORD=123456
      - MYSQL_DATABASE=note
    ports:
      - "3306:3306"

  mongodb:
    image: mongo:4.4
    ports:
      - "27017:27017"

  redis:
    image: redis:6.0
    ports:
      - "6379:6379"
```

### 3. 启动服务

```bash
docker-compose up -d
```

### 4. 访问 API 文档

项目启动后，可以通过以下地址访问 API 文档：

```
http://localhost:3000/api-docs
```

## 环境变量说明

| 环境变量 | 描述 | 默认值 |
|---------|------|-------|
| PORT | 服务器端口 | 3000 |
| MYSQL_HOST | MySQL 数据库主机地址 | localhost |
| MYSQL_USER | MySQL 数据库用户名 | root |
| MYSQL_PASSWORD | MySQL 数据库密码 | "" |
| MYSQL_DATABASE | MySQL 数据库名称 | test |
| MONGODB_URI | MongoDB 连接字符串 | mongodb://localhost:27017/test |
| REDIS_HOST | Redis 主机地址 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
| REDIS_PASSWORD | Redis 密码 | null |
| EMAIL_USER_NAME | 邮箱用户名 | "" |
| EMAIL_PASSWORD | 邮箱密码 | "" |
| EMAIL_HOST | 邮箱 SMTP 服务器 | "" |
| CLEAR_DATABASE | 是否清空数据库 | false |

## 注意事项

1. **数据库连接**：
   - 本地开发时，确保所有数据库服务已经启动
   - 生产环境中，使用云服务提供商的数据库服务，确保连接字符串正确配置
   - Vercel 环境中，数据库连接可能会在服务器启动时失败，但服务器会继续运行

2. **文件上传**：
   - 项目使用 `./uploads` 目录存储上传的文件
   - 在生产环境中，建议使用云存储服务，如 Amazon S3、阿里云 OSS 等

3. **安全配置**：
   - 生产环境中，确保修改默认的超级管理员账号和密码
   - 配置适当的 CORS 策略
   - 考虑使用 HTTPS

4. **性能优化**：
   - 配置适当的数据库连接池大小
   - 考虑使用缓存策略
   - 优化查询性能

5. **监控和日志**：
   - 配置适当的日志记录
   - 考虑使用监控服务，如 New Relic、Datadog 等

## 故障排查

### 1. 数据库连接失败

- 检查数据库服务是否已经启动
- 检查环境变量配置是否正确
- 检查数据库用户权限是否正确

### 2. 端口被占用

- 本地开发时，可以修改 `.env` 文件中的 `PORT` 配置
- 或者使用 `npm run dev` 命令，它会自动尝试使用下一个可用端口

### 3. 文件上传失败

- 检查 `./uploads` 目录是否存在，并且有写入权限
- 检查文件大小是否超过限制

### 4. API 访问失败

- 检查服务器是否正在运行
- 检查 API 路径是否正确
- 检查是否有适当的权限

## 总结

本项目支持多种部署方式，包括本地部署、Vercel 部署和 Docker 部署。根据实际需求选择合适的部署方式，并确保正确配置环境变量和数据库连接信息。

部署完成后，建议进行充分的测试，确保所有功能正常工作。