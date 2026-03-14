# Koa Backend 项目

## 项目描述

这是一个基于 Koa 框架的后端项目，集成了 MySQL、MongoDB 和 Swagger 文档。项目提供了用户认证、文件上传、字典管理、勋章系统、充值系统和兑换码系统等功能。

## 技术栈

- Node.js
- Koa 2
- MongoDB
- MySQL
- Swagger
- JWT 认证

## 目录结构

```
├── config/          # 配置文件
├── middleware/      # 中间件
├── models/          # 数据模型
├── routes/          # 路由
├── utils/           # 工具函数
├── uploads/         # 上传文件目录
├── index.js         # 入口文件
├── package.json     # 项目配置
└── README.md        # 项目说明
```

## 接口文档

### 1. 用户相关接口

#### 1.1 登录

- **作用**：用户登录获取token
- **路径**：`POST /api/users/login`
- **参数**：
  - email: string (邮箱)
  - password: string (密码)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "token": "JWT token",
      "user": {
        "id": "用户ID",
        "username": "用户名",
        "email": "邮箱",
        "role": "角色",
        "balance": 0
      }
    }
  }
  ```

#### 1.2 注册

- **作用**：用户注册
- **路径**：`POST /api/users/register`
- **参数**：
  - username: string (用户名)
  - email: string (邮箱)
  - password: string (密码)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "注册成功",
    "data": {
      "id": "用户ID",
      "username": "用户名",
      "email": "邮箱"
    }
  }
  ```

### 2. 文件上传接口

#### 2.1 上传文件

- **作用**：上传文件（支持图片、PDF等）
- **路径**：`POST /api/files/upload`
- **参数**：
  - file: file (文件)
  - description: string (文件描述，可选)
  - type: string (文件类型，如 carousel、icon、user_image)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "data": {
      "filename": "文件名",
      "originalFilename": "原始文件名",
      "mimeType": "文件类型",
      "size": 1024,
      "path": "/文件名",
      "description": "文件描述",
      "type": "文件类型"
    }
  }
  ```

#### 2.2 获取用户文件列表

- **作用**：获取当前用户上传的文件列表
- **路径**：`GET /api/files`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "Files retrieved successfully",
    "data": []
  }
  ```

#### 2.3 管理员获取所有文件

- **作用**：获取所有用户上传的文件列表（管理员专用）
- **路径**：`GET /api/admin/files/list`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "All files retrieved successfully",
    "data": []
  }
  ```

### 3. 字典管理接口

#### 3.1 获取所有字典

- **作用**：获取系统中所有字典数据
- **路径**：`GET /api/dictionaries`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "type": "file_type",
        "items": [
          {
            "key": "carousel",
            "value": "首页轮播图",
            "description": "用于首页轮播展示的图片",
            "sort": 1,
            "status": true
          }
        ],
        "description": "文件类型字典"
      }
    ]
  }
  ```

#### 3.2 获取指定类型字典

- **作用**：根据类型获取字典数据
- **路径**：`GET /api/dictionaries/{type}`
- **参数**：
  - type: string (字典类型)
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "type": "file_type",
      "items": [
        {
          "key": "carousel",
          "value": "首页轮播图",
          "description": "用于首页轮播展示的图片",
          "sort": 1,
          "status": true
        }
      ],
      "description": "文件类型字典"
    }
  }
  ```

#### 3.3 创建字典（管理员专用）

- **作用**：创建新的字典
- **路径**：`POST /api/admin/dictionaries`
- **参数**：
  - type: string (字典类型)
  - items: array (字典项)
  - description: string (字典描述，可选)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "字典创建成功",
    "data": {
      "type": "file_type",
      "items": [],
      "description": "文件类型字典"
    }
  }
  ```

#### 3.4 更新字典（管理员专用）

- **作用**：更新指定类型的字典
- **路径**：`PUT /api/admin/dictionaries/{type}`
- **参数**：
  - type: string (字典类型)
  - items: array (字典项，可选)
  - description: string (字典描述，可选)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "字典更新成功",
    "data": {
      "type": "file_type",
      "items": [],
      "description": "文件类型字典"
    }
  }
  ```

#### 3.5 删除字典（管理员专用）

- **作用**：删除指定类型的字典
- **路径**：`DELETE /api/admin/dictionaries/{type}`
- **参数**：
  - type: string (字典类型)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "字典删除成功"
  }
  ```

### 4. 勋章系统接口

#### 4.1 获取当前用户的勋章

- **作用**：获取当前登录用户已获得的所有勋章
- **路径**：`GET /api/medals/user`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "获取用户勋章成功",
    "data": []
  }
  ```

#### 4.2 获取所有勋章

- **作用**：获取系统中所有可获得的勋章
- **路径**：`GET /api/medals`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "获取勋章列表成功",
    "data": []
  }
  ```

#### 4.3 获取单个勋章详情

- **作用**：根据勋章ID获取勋章详情
- **路径**：`GET /api/medals/{id}`
- **参数**：
  - id: string (勋章ID)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "获取勋章详情成功",
    "data": {
      "id": "勋章ID",
      "name": "勋章名称",
      "description": "勋章描述",
      "icon": "勋章图标"
    }
  }
  ```

#### 4.4 管理员颁发勋章

- **作用**：管理员为指定用户颁发勋章
- **路径**：`POST /api/admin/medals/award`
- **参数**：
  - userId: string (用户ID)
  - medalId: string (勋章ID)
  - reason: string (颁发原因)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "勋章颁发成功",
    "data": {
      "id": "用户勋章ID",
      "userId": "用户ID",
      "medalId": "勋章ID",
      "obtainedAt": "2026-03-05T00:00:00.000Z",
      "reason": "颁发原因"
    }
  }
  ```

### 5. 充值系统接口

#### 5.1 充值VIP

- **作用**：为当前用户充值VIP会员
- **路径**：`POST /api/recharge/vip`
- **参数**：
  - duration: number (充值天数)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "VIP充值成功",
    "data": {
      "vipExpireDate": "2026-06-05T00:00:00.000Z"
    }
  }
  ```

#### 5.2 充值余额

- **作用**：为当前用户充值账户余额
- **路径**：`POST /api/recharge/balance`
- **参数**：
  - amount: number (充值金额)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "余额充值成功",
    "data": {
      "balance": 100
    }
  }
  ```

#### 5.3 获取用户充值记录

- **作用**：获取当前用户的充值记录
- **路径**：`GET /api/recharge/records`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "充值记录获取成功",
    "data": []
  }
  ```

#### 5.4 管理员获取所有充值记录

- **作用**：获取所有用户的充值记录（管理员专用）
- **路径**：`GET /api/admin/recharge/records`
- **参数**：
  - userId: string (用户ID，可选)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "充值记录获取成功",
    "data": []
  }
  ```

### 6. 兑换码系统接口

#### 6.1 生成兑换码（管理员专用）

- **作用**：生成VIP/SVIP/余额兑换码
- **路径**：`POST /api/admin/redeem/generate`
- **参数**：
  - type: string (兑换码类型：vip, svip, balance)
  - value: number (兑换码价值)
  - count: number (生成数量)
  - expireDays: number (有效期天数)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "兑换码生成成功",
    "data": {
      "codes": ["兑换码1", "兑换码2"],
      "type": "vip",
      "value": 30,
      "expiresAt": "2026-04-05T00:00:00.000Z",
      "count": 2
    }
  }
  ```

#### 6.2 使用兑换码

- **作用**：用户使用兑换码获取相应权益
- **路径**：`POST /api/redeem/use`
- **参数**：
  - code: string (兑换码)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "兑换成功",
    "data": {
      "type": "vip",
      "expireDate": "2026-04-05 00:00:00"
    }
  }
  ```

#### 6.3 管理员获取兑换码列表

- **作用**：获取所有兑换码列表（管理员专用）
- **路径**：`GET /api/admin/redeem/codes`
- **参数**：
  - type: string (兑换码类型，可选)
  - isUsed: boolean (是否已使用，可选)
- **返回结果**：
  ```json
  {
    "success": true,
    "data": []
  }
  ```

### 7. 超级管理员接口

#### 7.1 获取管理员列表

- **作用**：获取所有管理员用户列表
- **路径**：`GET /api/admin/superadmin/admins`
- **参数**：无
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "管理员ID",
        "username": "管理员用户名",
        "email": "管理员邮箱",
        "role": "admin",
        "status": "active"
      }
    ]
  }
  ```

#### 7.2 创建管理员

- **作用**：创建新的管理员账号
- **路径**：`POST /api/admin/superadmin/admins`
- **参数**：
  - username: string (用户名)
  - email: string (邮箱)
  - password: string (密码)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员创建成功",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "email": "管理员邮箱",
      "role": "admin",
      "status": "active"
    }
  }
  ```

#### 7.3 更新管理员信息

- **作用**：更新指定管理员的信息
- **路径**：`PUT /api/admin/superadmin/admins/{id}`
- **参数**：
  - id: string (管理员ID)
  - username: string (用户名，可选)
  - password: string (密码，可选)
  - avatar: string (头像，可选)
  - signature: string (签名，可选)
  - bio: string (个人简介，可选)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员信息更新成功",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "email": "管理员邮箱",
      "role": "admin",
      "status": "active"
    }
  }
  ```

#### 7.4 启用/停用管理员

- **作用**：启用或停用指定的管理员账号
- **路径**：
  - 启用：`PUT /api/admin/superadmin/admins/{id}/activate`
  - 停用：`PUT /api/admin/superadmin/admins/{id}/deactivate`
- **参数**：
  - id: string (管理员ID)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员账号已启用",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "status": "active"
    }
  }
  ```

#### 7.5 删除管理员

- **作用**：删除指定的管理员账号
- **路径**：`DELETE /api/admin/superadmin/admins/{id}`
- **参数**：
  - id: string (管理员ID)
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员删除成功",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名"
    }
  }
  ```

## 运行项目

1. 安装依赖
   ```bash
   npm install
   ```

2. 启动开发服务器
   ```bash
   npm run dev
   ```

3. 访问接口文档
   ```
   http://localhost:3000/api-docs
   ```

## 环境变量

项目需要以下环境变量：

- `PORT` - 服务器端口
- `MONGODB_URI` - MongoDB 连接字符串
- `MYSQL_HOST` - MySQL 主机
- `MYSQL_USER` - MySQL 用户名
- `MYSQL_PASSWORD` - MySQL 密码
- `MYSQL_DATABASE` - MySQL 数据库名
- `JWT_SECRET` - JWT 密钥
- `EMAIL_HOST` - 邮箱服务器
- `EMAIL_PORT` - 邮箱服务器端口
- `EMAIL_USER_NAME` - 邮箱用户名
- `EMAIL_PASSWORD` - 邮箱密码

## 注意事项

- 项目默认使用端口 3000，如果被占用会自动递增
- 首次启动会自动创建超级管理员账号
- 上传文件默认保存在 `./uploads` 目录
- 所有管理接口需要管理员权限
- 超级管理员接口需要超级管理员权限