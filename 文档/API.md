# API 接口文档

本文档详细描述了项目中所有可用的API接口，包括接口路径、请求方法、参数说明、返回结果等信息，方便前端开发人员直接使用。

## 基础信息

- **API基础路径**：`http://localhost:3000`
- **认证方式**：JWT Token（Bearer Token）
- **请求格式**：JSON（除文件上传外）
- **响应格式**：JSON

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {...}
}
```

### 失败响应

```json
{
  "success": false,
  "message": "操作失败原因"
}
```

## 接口分类

### 1. 用户相关接口

#### 1.1 发送验证码

- **路径**：`POST /api/users/send-code`
- **描述**：发送验证码到指定邮箱
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----- | ------ | -- | ----------------------------------------- |
  | email | string | 是 | 邮箱地址 |
  | type | string | 是 | 验证码类型：register（注册）或 reset_password（重置密码） |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "验证码发送成功，请注意查收"
  }
  ```

#### 1.2 用户注册

- **路径**：`POST /api/users/register`
- **描述**：创建新用户
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | -------------------------------- |
  | username | string | 否 | 用户名（如果不提供，将使用nickname作为username） |
  | nickname | string | 是 | 昵称 |
  | email | string | 是 | 邮箱地址 |
  | password | string | 是 | 密码 |
  | code | string | 是 | 验证码 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "用户注册成功"
  }
  ```

#### 1.3 用户登录

- **路径**：`POST /api/users/login`
- **描述**：用户登录并获取JWT令牌
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | ---- |
  | email | string | 是 | 邮箱地址 |
  | password | string | 是 | 密码 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "user": {
        "id": "用户ID",
        "uuid": "用户UUID",
        "username": "用户名",
        "nickname": "昵称",
        "email": "邮箱",
        "phone": "手机号",
        "avatar": "头像URL",
        "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
        "status": 1, // 0=禁用，1=正常，2=冻结
        "vip_expire": "VIP到期时间",
        "vipExpireDate": "VIP到期时间",
        "svipExpireDate": "SVIP到期时间",
        "balance": 100,
        "diary_count": 5,
        "word_count": 1000,
        "like_count": 20,
        "follower_count": 10,
        "following_count": 8,
        "settings": {...},
        "medals": [...],
        "totalLoginDays": 10,
        "consecutiveLoginDays": 5,
        "last_login_at": "最后登录时间",
        "last_login_ip": "最后登录IP",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      },
      "token": "JWT令牌",
      "loginStats": {...},
      "awardedMedals": [...]
    }
  }
  ```

#### 1.4 获取用户个人信息

- **路径**：`GET /api/users/profile`
- **描述**：获取当前登录用户的个人信息
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "id": "用户ID",
      "uuid": "用户UUID",
      "username": "用户名",
      "nickname": "昵称",
      "email": "邮箱",
      "phone": "手机号",
      "avatar": "头像URL",
      "gender": 0, // 0=未知，1=男，2=女
      "birthday": "出生日期",
      "bio": "个人简介",
      "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
      "status": 1, // 0=禁用，1=正常，2=冻结
      "vip_expire": "VIP到期时间",
      "vipExpireDate": "VIP到期时间",
      "svipExpireDate": "SVIP到期时间",
      "balance": 100,
      "diary_count": 5,
      "word_count": 1000,
      "like_count": 20,
      "follower_count": 10,
      "following_count": 8,
      "settings": {...},
      "medals": [...],
      "totalLoginDays": 10,
      "consecutiveLoginDays": 5,
      "last_login_at": "最后登录时间",
      "last_login_ip": "最后登录IP",
      "loginCount": 50,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 1.5 更新用户个人信息

- **路径**：`PUT /api/users/profile`
- **描述**：更新当前登录用户的个人信息
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | --------------- |
  | username | string | 否 | 用户名 |
  | nickname | string | 否 | 昵称 |
  | password | string | 否 | 密码 |
  | avatar | string | 否 | 头像URL |
  | gender | number | 否 | 性别：0=未知，1=男，2=女 |
  | birthday | string | 否 | 出生日期 |
  | bio | string | 否 | 个人简介 |
  | signature | string | 否 | 签名 |
  | settings | object | 否 | 个性化设置 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "个人信息更新成功",
    "data": {
      "id": "用户ID",
      "uuid": "用户UUID",
      "username": "用户名",
      "nickname": "昵称",
      "email": "邮箱",
      "phone": "手机号",
      "avatar": "头像URL",
      "gender": 0, // 0=未知，1=男，2=女
      "birthday": "出生日期",
      "bio": "个人简介",
      "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
      "status": 1, // 0=禁用，1=正常，2=冻结
      "settings": {...},
      "last_login_at": "最后登录时间",
      "last_login_ip": "最后登录IP",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 1.6 获取所有用户（管理员）

- **路径**：`GET /api/users`
- **描述**：获取所有用户列表（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "用户ID",
        "username": "用户名",
        "email": "邮箱",
        "role": "用户角色",
        "status": "状态"
      }
    ]
  }
  ```

#### 1.7 更新用户角色（管理员）

- **路径**：`PUT /api/users/{id}/role`
- **描述**：更新指定用户的角色（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ----------------------------- |
  | role | number | 是 | 新角色：0=普通用户，1=VIP，2=SVIP，3=管理员 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "角色更新成功",
    "data": {
      "id": "用户ID",
      "username": "用户名",
      "role": 0 // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
    }
  }
  ```

#### 1.8 重置密码

- **路径**：`POST /api/users/reset-password`
- **描述**：使用验证码重置密码
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----------- | ------ | -- | ---- |
  | email | string | 是 | 邮箱地址 |
  | code | string | 是 | 验证码 |
  | newPassword | string | 是 | 新密码 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "密码重置成功"
  }
  ```

#### 1.9 抖音一键登录

- **路径**：`POST /api/users/douyin-login`
- **描述**：使用抖音code进行登录或注册
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | code | string | 是 | 抖音登录code |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "抖音登录成功，新用户注册",
    "data": {
      "user": {
        "id": "用户ID",
        "uuid": "用户UUID",
        "username": "用户名",
        "nickname": "昵称",
        "email": "邮箱",
        "phone": "手机号",
        "avatar": "头像URL",
        "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
        "status": 1, // 0=禁用，1=正常，2=冻结
        "vip_expire": "VIP到期时间",
        "vipExpireDate": "VIP到期时间",
        "svipExpireDate": "SVIP到期时间",
        "balance": 100,
        "diary_count": 5,
        "word_count": 1000,
        "like_count": 20,
        "follower_count": 10,
        "following_count": 8,
        "settings": {...},
        "medals": [...],
        "totalLoginDays": 10,
        "consecutiveLoginDays": 5,
        "last_login_at": "最后登录时间",
        "last_login_ip": "最后登录IP",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      },
      "token": "JWT令牌",
      "isNewUser": true,
      "loginStats": {...},
      "awardedMedals": [...]
    }
  }
  ```

#### 1.10 快手一键登录

- **路径**：`POST /api/users/kuaishou-login`
- **描述**：使用快手code进行登录或注册
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | code | string | 是 | 快手登录code |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "快手登录成功，新用户注册",
    "data": {
      "user": {
        "id": "用户ID",
        "uuid": "用户UUID",
        "username": "用户名",
        "nickname": "昵称",
        "email": "邮箱",
        "phone": "手机号",
        "avatar": "头像URL",
        "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
        "status": 1, // 0=禁用，1=正常，2=冻结
        "vip_expire": "VIP到期时间",
        "vipExpireDate": "VIP到期时间",
        "svipExpireDate": "SVIP到期时间",
        "balance": 100,
        "diary_count": 5,
        "word_count": 1000,
        "like_count": 20,
        "follower_count": 10,
        "following_count": 8,
        "settings": {...},
        "medals": [...],
        "totalLoginDays": 10,
        "consecutiveLoginDays": 5,
        "last_login_at": "最后登录时间",
        "last_login_ip": "最后登录IP",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      },
      "token": "JWT令牌",
      "isNewUser": true,
      "loginStats": {...},
      "awardedMedals": [...]
    }
  }
  ```

#### 1.11 支付宝一键登录

- **路径**：`POST /api/users/alipay-login`
- **描述**：使用支付宝code进行登录或注册
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | code | string | 是 | 支付宝登录code |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "支付宝登录成功，新用户注册",
    "data": {
      "user": {
        "id": "用户ID",
        "uuid": "用户UUID",
        "username": "用户名",
        "nickname": "昵称",
        "email": "邮箱",
        "phone": "手机号",
        "avatar": "头像URL",
        "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
        "status": 1, // 0=禁用，1=正常，2=冻结
        "vip_expire": "VIP到期时间",
        "vipExpireDate": "VIP到期时间",
        "svipExpireDate": "SVIP到期时间",
        "balance": 100,
        "diary_count": 5,
        "word_count": 1000,
        "like_count": 20,
        "follower_count": 10,
        "following_count": 8,
        "settings": {...},
        "medals": [...],
        "totalLoginDays": 10,
        "consecutiveLoginDays": 5,
        "last_login_at": "最后登录时间",
        "last_login_ip": "最后登录IP",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      },
      "token": "JWT令牌",
      "isNewUser": true,
      "loginStats": {...},
      "awardedMedals": [...]
    }
  }
  ```

#### 1.12 QQ一键登录

- **路径**：`POST /api/users/qq-login`
- **描述**：使用QQ code进行登录或注册
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | code | string | 是 | QQ登录code |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "QQ登录成功，新用户注册",
    "data": {
      "user": {
        "id": "用户ID",
        "uuid": "用户UUID",
        "username": "用户名",
        "nickname": "昵称",
        "email": "邮箱",
        "phone": "手机号",
        "avatar": "头像URL",
        "role": 0, // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
        "status": 1, // 0=禁用，1=正常，2=冻结
        "vip_expire": "VIP到期时间",
        "vipExpireDate": "VIP到期时间",
        "svipExpireDate": "SVIP到期时间",
        "balance": 100,
        "diary_count": 5,
        "word_count": 1000,
        "like_count": 20,
        "follower_count": 10,
        "following_count": 8,
        "settings": {...},
        "medals": [...],
        "totalLoginDays": 10,
        "consecutiveLoginDays": 5,
        "last_login_at": "最后登录时间",
        "last_login_ip": "最后登录IP",
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      },
      "token": "JWT令牌",
      "isNewUser": true,
      "loginStats": {...},
      "awardedMedals": [...]
    }
  }
  ```

#### 1.13 微信登录

- **路径**：`POST /api/user/wx-login`
- **描述**：使用微信code进行登录或注册
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | code | string | 是 | 微信授权码 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "微信登录成功",
    "data": {
      "user": {
        "id": "用户ID",
        "nickname": "昵称",
        "avatar": "头像URL",
        "email": "邮箱",
        "phone": "手机号",
        "role": 0,
        "status": 1
      },
      "token": "JWT令牌",
      "isNewUser": true,
      "loginStats": {
        "totalLoginDays": 1,
        "consecutiveLoginDays": 1
      }
    }
  }
  ```

### 2. 字典相关接口

#### 2.1 获取所有字典

- **路径**：`GET /api/dictionaries`
- **描述**：获取系统中所有字典数据
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "type": "字典类型",
        "items": [
          {
            "key": "键",
            "value": "值",
            "description": "描述",
            "sort": 1,
            "status": true
          }
        ],
        "description": "字典描述"
      }
    ]
  }
  ```

#### 2.2 获取指定类型字典

- **路径**：`GET /api/dictionaries/{type}`
- **描述**：根据类型获取字典数据
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---- |
  | type | string | 是 | 字典类型 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "type": "字典类型",
      "items": [
        {
          "key": "键",
          "value": "值",
          "description": "描述",
          "sort": 1,
          "status": true
        }
      ],
      "description": "字典描述"
    }
  }
  ```

#### 2.3 创建字典（管理员）

- **路径**：`POST /api/admin/dictionaries`
- **描述**：创建新的字典
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----------- | ------ | -- | ----- |
  | type | string | 是 | 字典类型 |
  | items | array | 否 | 字典项数组 |
  | description | string | 否 | 字典描述 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "字典创建成功",
    "data": {
      "type": "字典类型",
      "items": [...],
      "description": "字典描述"
    }
  }
  ```

#### 2.4 更新字典（管理员）

- **路径**：`PUT /api/admin/dictionaries/{type}`
- **描述**：更新指定类型的字典
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----------- | ------ | -- | ----- |
  | items | array | 否 | 字典项数组 |
  | description | string | 否 | 字典描述 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "字典更新成功",
    "data": {
      "type": "字典类型",
      "items": [...],
      "description": "字典描述"
    }
  }
  ```

#### 2.5 删除字典（管理员）

- **路径**：`DELETE /api/admin/dictionaries/{type}`
- **描述**：删除指定类型的字典
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---- |
  | type | string | 是 | 字典类型 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "字典删除成功"
  }
  ```

### 3. 文件相关接口

#### 3.1 上传文件

- **路径**：`POST /api/files/upload`
- **描述**：上传任何类型的文件（PDF、图片、视频等）
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----------- | ------ | -- | ----------------------------------- |
  | file | file | 是 | 文件 |
  | description | string | 否 | 文件描述 |
  | type | string | 否 | 文件类型（如：carousel, icon, user_image） |
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

#### 3.2 获取用户上传的文件

- **路径**：`GET /api/files`
- **描述**：获取当前用户上传的文件列表
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "Files retrieved successfully",
    "data": []
  }
  ```

#### 3.3 获取所有上传的文件（管理员）

- **路径**：`GET /api/admin/files/list`
- **描述**：获取所有用户上传的文件列表（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "All files retrieved successfully",
    "data": []
  }
  ```

### 4. 勋章相关接口

#### 4.1 获取当前用户的勋章列表

- **路径**：`GET /api/medals/user`
- **描述**：获取当前登录用户已获得的所有勋章
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "获取用户勋章成功",
    "data": [
      {
        "id": "勋章ID",
        "name": "勋章名称",
        "description": "勋章描述",
        "icon": "勋章图标",
        "awardedAt": "获得时间"
      }
    ]
  }
  ```

#### 4.2 获取所有勋章列表

- **路径**：`GET /api/medals`
- **描述**：获取系统中所有可获得的勋章
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "获取勋章列表成功",
    "data": [
      {
        "id": "勋章ID",
        "name": "勋章名称",
        "description": "勋章描述",
        "icon": "勋章图标"
      }
    ]
  }
  ```

#### 4.3 获取单个勋章详情

- **路径**：`GET /api/medals/{id}`
- **描述**：根据勋章ID获取勋章详情
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | id | string | 是 | 勋章ID |
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

#### 4.4 管理员手动颁发勋章

- **路径**：`POST /api/admin/medals/award`
- **描述**：管理员为指定用户颁发勋章
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------- | ------ | -- | ---- |
  | userId | string | 是 | 用户ID |
  | medalId | string | 是 | 勋章ID |
  | reason | string | 是 | 颁发原因 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "勋章颁发成功",
    "data": {
      "userId": "用户ID",
      "medalId": "勋章ID",
      "awardedAt": "颁发时间",
      "reason": "颁发原因"
    }
  }
  ```

### 5. 充值相关接口

#### 5.1 充值VIP

- **路径**：`POST /api/recharge/vip`
- **描述**：为当前用户充值VIP会员
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | ---- |
  | duration | number | 是 | 充值天数 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "VIP充值成功",
    "data": {
      "vipExpireDate": "VIP到期时间"
    }
  }
  ```

#### 5.2 充值SVIP

- **路径**：`POST /api/recharge/svip`
- **描述**：为当前用户充值SVIP会员
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | ---- |
  | duration | number | 是 | 充值天数 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "SVIP充值成功",
    "data": {
      "svipExpireDate": "SVIP到期时间"
    }
  }
  ```

#### 5.3 充值余额

- **路径**：`POST /api/recharge/balance`
- **描述**：为当前用户充值账户余额
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---- |
  | amount | number | 是 | 充值金额 |
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

#### 5.4 获取充值记录

- **路径**：`GET /api/recharge/records`
- **描述**：获取当前用户的充值记录
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "记录ID",
        "userId": "用户ID",
        "amount": 100,
        "type": "vip",
        "duration": 30,
        "expireDate": "到期时间",
        "status": "success",
        "createdAt": "创建时间"
      }
    ]
  }
  ```

#### 5.5 获取所有用户充值记录（管理员）

- **路径**：`GET /api/admin/recharge/records`
- **描述**：获取所有用户的充值记录（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---- |
  | userId | string | 否 | 用户ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "充值记录获取成功",
    "data": [
      {
        "id": "记录ID",
        "userId": {
          "username": "用户名",
          "email": "邮箱"
        },
        "amount": 100,
        "type": "vip",
        "duration": 30,
        "expireDate": "到期时间",
        "status": "success",
        "createdAt": "创建时间"
      }
    ]
  }
  ```

### 6. 兑换码相关接口

#### 6.1 生成兑换码（管理员）

- **路径**：`POST /api/admin/redeem/generate`
- **描述**：生成VIP/SVIP/余额兑换码（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---------- | ------ | -- | ------------------------ |
  | type | string | 是 | 兑换码类型：vip, svip, balance |
  | value | number | 是 | 兑换码价值（天数或金额） |
  | count | number | 是 | 生成数量 |
  | expireDays | number | 是 | 兑换码有效期（天） |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "兑换码生成成功",
    "data": {
      "codes": ["兑换码1", "兑换码2"],
      "type": "vip",
      "value": 30,
      "expiresAt": "到期时间",
      "count": 2
    }
  }
  ```

#### 6.2 使用兑换码

- **路径**：`POST /api/redeem/use`
- **描述**：用户使用兑换码获取相应权益
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | --- |
  | code | string | 是 | 兑换码 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "兑换成功",
    "data": {
      "type": "vip",
      "expireDate": "到期时间"
    }
  }
  ```

#### 6.3 获取兑换码列表（管理员）

- **路径**：`GET /api/admin/redeem/codes`
- **描述**：获取所有兑换码列表（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------- | -- | ----- |
  | type | string | 否 | 兑换码类型 |
  | isUsed | boolean | 否 | 是否已使用 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "兑换码ID",
        "code": "兑换码",
        "type": "vip",
        "value": 30,
        "expiresAt": "到期时间",
        "isUsed": false,
        "usedBy": null,
        "usedAt": null,
        "createdAt": "创建时间"
      }
    ]
  }
  ```

### 7. 超级管理员专用接口

#### 7.1 获取管理员列表

- **路径**：`GET /api/admin/superadmin/admins`
- **描述**：获取所有管理员用户列表（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "管理员ID",
        "username": "管理员用户名",
        "email": "管理员邮箱",
        "role": 3, // 3=管理员
        "status": 1 // 1=正常
      }
    ]
  }
  ```

#### 7.2 获取管理员详情

- **路径**：`GET /api/admin/superadmin/admins/{id}`
- **描述**：获取指定管理员的详细信息（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ----- |
  | id | string | 是 | 管理员ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "email": "管理员邮箱",
      "role": 3, // 3=管理员
      "status": 1 // 1=正常
    }
  }
  ```

#### 7.3 创建管理员

- **路径**：`POST /api/admin/superadmin/admins`
- **描述**：创建新的管理员账号（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | --- |
  | username | string | 是 | 用户名 |
  | email | string | 是 | 邮箱 |
  | password | string | 是 | 密码 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员创建成功",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "nickname": "管理员昵称",
      "email": "管理员邮箱",
      "role": 3, // 3=管理员
      "status": 1, // 1=正常
      "createdAt": "创建时间"
    }
  }
  ```

#### 7.4 更新管理员信息

- **路径**：`PUT /api/admin/superadmin/admins/{id}`
- **描述**：更新指定管理员的信息（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ----- |
  | username | string | 否 | 用户名 |
  | nickname | string | 否 | 昵称 |
  | password | string | 否 | 密码 |
  | avatar | string | 否 | 头像URL |
  | signature | string | 否 | 签名 |
  | bio | string | 否 | 个人简介 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员信息更新成功",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "nickname": "管理员昵称",
      "email": "管理员邮箱",
      "role": 3, // 3=管理员
      "status": 1, // 1=正常
      "avatar": "头像URL",
      "signature": "签名",
      "bio": "个人简介"
    }
  }
  ```

#### 7.5 启用管理员账号

- **路径**：`PUT /api/admin/superadmin/admins/{id}/activate`
- **描述**：启用指定的管理员账号（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ----- |
  | id | string | 是 | 管理员ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员账号已启用",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "status": 1 // 1=正常
    }
  }
  ```

#### 7.6 停用管理员账号

- **路径**：`PUT /api/admin/superadmin/admins/{id}/deactivate`
- **描述**：停用指定的管理员账号（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ----- |
  | id | string | 是 | 管理员ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "管理员账号已停用",
    "data": {
      "id": "管理员ID",
      "username": "管理员用户名",
      "status": 0 // 0=禁用
    }
  }
  ```

#### 7.7 删除管理员

- **路径**：`DELETE /api/admin/superadmin/admins/{id}`
- **描述**：删除指定的管理员账号（仅超级管理员可用）
- **认证**：需要JWT Token，且角色为superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ----- |
  | id | string | 是 | 管理员ID |
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

### 8. 导出导入相关接口

#### 8.1 导出用户数据

- **路径**：`GET /api/admin/export/users`
- **描述**：导出用户数据，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---------------------------- |
  | format | string | 否 | 导出格式：csv, xlsx, json（默认json） |
  | limit | number | 否 | 导出数量限制，0表示全部 |
- **返回结果**：文件下载

#### 8.2 导出字典数据

- **路径**：`GET /api/admin/export/dictionaries`
- **描述**：导出字典数据，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---------------------------- |
  | format | string | 否 | 导出格式：csv, xlsx, json（默认json） |
- **返回结果**：文件下载

#### 8.3 导出勋章数据

- **路径**：`GET /api/admin/export/medals`
- **描述**：导出勋章数据，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---------------------------- |
  | format | string | 否 | 导出格式：csv, xlsx, json（默认json） |
- **返回结果**：文件下载

#### 8.4 导出充值记录

- **路径**：`GET /api/admin/export/recharge-records`
- **描述**：导出充值记录，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---------------------------- |
  | format | string | 否 | 导出格式：csv, xlsx, json（默认json） |
  | limit | number | 否 | 导出数量限制，0表示全部 |
- **返回结果**：文件下载

#### 8.5 导出兑换码

- **路径**：`GET /api/admin/export/redeem-codes`
- **描述**：导出兑换码，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ------ | ------ | -- | ---------------------------- |
  | format | string | 否 | 导出格式：csv, xlsx, json（默认json） |
  | limit | number | 否 | 导出数量限制，0表示全部 |
- **返回结果**：文件下载

#### 8.6 导入用户数据

- **路径**：`POST /api/admin/import/users`
- **描述**：导入用户数据，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ---- | -- | ---- |
  | file | file | 是 | 导入文件 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "导入完成，成功 10 条，失败 0 条"
  }
  ```

#### 8.7 导入字典数据

- **路径**：`POST /api/admin/import/dictionaries`
- **描述**：导入字典数据，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ---- | -- | ---- |
  | file | file | 是 | 导入文件 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "导入完成，成功 5 条，失败 0 条"
  }
  ```

#### 8.8 导入勋章数据

- **路径**：`POST /api/admin/import/medals`
- **描述**：导入勋章数据，支持CSV、Excel和JSON格式
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ---- | -- | ---- |
  | file | file | 是 | 导入文件 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "导入完成，成功 8 条，失败 0 条"
  }
  ```

### 9. 日记相关接口

#### 9.1 创建日记

- **路径**：`POST /api/diaries`
- **描述**：创建新的日记
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---------------- | ------- | -- | --------------------------------- |
  | title | string | 是 | 日记标题 |
  | content | string | 是 | 日记内容 |
  | diary_date | string | 是 | 日记日期（格式：YYYY-MM-DD） |
  | weather | string | 否 | 天气情况 |
  | mood | string | 否 | 心情状态 |
  | signature | string | 否 | 签名 |
  | location | string | 否 | 地点 |
  | location_coords | object | 否 | 坐标信息 { lat: number, lng: number } |
  | cover | string | 否 | 封面图片URL |
  | images | array | 否 | 图片URL数组 |
  | tags | array | 否 | 标签数组 |
  | is_public | boolean | 否 | 是否公开 |
  | is_top | boolean | 否 | 是否置顶 |
  | event_id | string | 否 | 关联事件ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "日记创建成功",
    "data": {
      "_id": "日记ID",
      "user_id": "用户ID",
      "title": "日记标题",
      "content": "日记内容",
      "diary_date": "2023-01-01",
      "weather": "晴天",
      "mood": "开心",
      "signature": "签名",
      "location": "北京",
      "location_coords": { "lat": 39.9042, "lng": 116.4074 },
      "cover": "封面图片URL",
      "images": ["图片1URL", "图片2URL"],
      "tags": ["标签1", "标签2"],
      "is_public": false,
      "is_top": false,
      "event_id": "事件ID",
      "view_count": 0,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 9.2 获取日记列表

- **路径**：`GET /api/diaries`
- **描述**：获取当前用户的日记列表
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认10） |
  | tag | string | 否 | 标签筛选 |
  | mood | string | 否 | 心情筛选 |
  | keyword | string | 否 | 模糊查询关键词（标题或内容） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "日记ID",
        "user_id": "用户ID",
        "title": "日记标题",
        "content": "日记内容",
        "diary_date": "2023-01-01",
        "weather": "晴天",
        "mood": "开心",
        "signature": "签名",
        "location": "北京",
        "cover": "封面图片URL",
        "images": ["图片1URL", "图片2URL"],
        "tags": ["标签1", "标签2"],
        "is_public": false,
        "is_top": false,
        "view_count": 0,
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "per_page": 10,
      "total_pages": 10
    }
  }
  ```

#### 9.3 获取日记详情

- **路径**：`GET /api/diaries/{id}`
- **描述**：获取指定日记的详细信息
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "_id": "日记ID",
      "user_id": "用户ID",
      "title": "日记标题",
      "content": "日记内容",
      "diary_date": "2023-01-01",
      "weather": "晴天",
      "mood": "开心",
      "signature": "签名",
      "location": "北京",
      "location_coords": { "lat": 39.9042, "lng": 116.4074 },
      "cover": "封面图片URL",
      "images": ["图片1URL", "图片2URL"],
      "tags": ["标签1", "标签2"],
      "is_public": false,
      "is_top": false,
      "event_id": "事件ID",
      "view_count": 1,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 9.4 更新日记

- **路径**：`PUT /api/diaries/{id}`
- **描述**：更新指定日记的信息
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---------------- | ------- | -- | --------------------------------- |
  | id | string | 是 | 日记ID |
  | title | string | 否 | 日记标题 |
  | content | string | 否 | 日记内容 |
  | diary_date | string | 否 | 日记日期（格式：YYYY-MM-DD） |
  | weather | string | 否 | 天气情况 |
  | mood | string | 否 | 心情状态 |
  | signature | string | 否 | 签名 |
  | location | string | 否 | 地点 |
  | location_coords | object | 否 | 坐标信息 { lat: number, lng: number } |
  | cover | string | 否 | 封面图片URL |
  | images | array | 否 | 图片URL数组 |
  | tags | array | 否 | 标签数组 |
  | is_public | boolean | 否 | 是否公开 |
  | is_top | boolean | 否 | 是否置顶 |
  | event_id | string | 否 | 关联事件ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "日记更新成功",
    "data": {
      "_id": "日记ID",
      "user_id": "用户ID",
      "title": "更新后的日记标题",
      "content": "更新后的日记内容",
      "diary_date": "2023-01-01",
      "weather": "晴天",
      "mood": "开心",
      "signature": "签名",
      "location": "北京",
      "location_coords": { "lat": 39.9042, "lng": 116.4074 },
      "cover": "封面图片URL",
      "images": ["图片1URL", "图片2URL"],
      "tags": ["标签1", "标签2"],
      "is_public": false,
      "is_top": false,
      "event_id": "事件ID",
      "view_count": 1,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 9.5 删除日记

- **路径**：`DELETE /api/diaries/{id}`
- **描述**：软删除指定日记
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "日记删除成功"
  }
  ```

#### 9.6 获取所有日记（管理员）

- **路径**：`GET /api/admin/diaries`
- **描述**：获取所有用户的日记列表（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---------- | ------- | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认10） |
  | user_id | string | 否 | 用户ID筛选 |
  | is_public | boolean | 否 | 是否公开筛选 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "日记ID",
        "user_id": {
          "username": "用户名",
          "email": "邮箱"
        },
        "title": "日记标题",
        "content": "日记内容",
        "diary_date": "2023-01-01",
        "weather": "晴天",
        "mood": "开心",
        "signature": "签名",
        "location": "北京",
        "cover": "封面图片URL",
        "images": ["图片1URL", "图片2URL"],
        "tags": ["标签1", "标签2"],
        "is_public": false,
        "is_top": false,
        "view_count": 0,
        "createdAt": "创建时间",
        "updatedAt": "更新时间"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "per_page": 10,
      "total_pages": 10
    }
  }
  ```

#### 9.7 获取日记详情（管理员）

- **路径**：`GET /api/admin/diaries/{id}`
- **描述**：获取指定日记的详细信息（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "_id": "日记ID",
      "user_id": {
        "username": "用户名",
        "email": "邮箱"
      },
      "title": "日记标题",
      "content": "日记内容",
      "diary_date": "2023-01-01",
      "weather": "晴天",
      "mood": "开心",
      "signature": "签名",
      "location": "北京",
      "location_coords": { "lat": 39.9042, "lng": 116.4074 },
      "cover": "封面图片URL",
      "images": ["图片1URL", "图片2URL"],
      "tags": ["标签1", "标签2"],
      "is_public": false,
      "is_top": false,
      "event_id": "事件ID",
      "view_count": 1,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

#### 9.8 删除日记（管理员）

- **路径**：`DELETE /api/admin/diaries/{id}`
- **描述**：软删除指定日记（仅管理员可用）
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "日记删除成功"
  }
  ```

### 10. 测试相关接口

#### 10.1 测试连接

- **路径**：`GET /api/test`
- **描述**：测试前端与后端的连接是否正常
- **认证**：不需要
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "测试成功",
    "data": {
      "timestamp": "2023-01-01T00:00:00.000Z"
    }
  }
  ```

### 11. 表情相关接口

#### 11.1 获取表情分类列表

- **路径**：`GET /api/emojis/categories`
- **描述**：获取表情分类列表
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "分类ID",
        "name": "分类名称",
        "icon": "分类图标",
        "sort": 1
      }
    ]
  }
  ```

#### 11.2 获取表情列表

- **路径**：`GET /api/emojis`
- **描述**：获取表情列表，可按分类筛选
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | category_id | string | 否 | 分类ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "表情ID",
        "name": "表情名称",
        "url": "表情图片URL",
        "category_id": "分类ID",
        "category_name": "分类名称",
        "usage_count": 100
      }
    ]
  }
  ```

#### 11.3 标记表情使用

- **路径**：`POST /api/emojis/use`
- **描述**：标记表情使用
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | emoji_id | string | 是 | 表情ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "标记成功"
  }
  ```

#### 11.4 收藏表情

- **路径**：`POST /api/emojis/favorite`
- **描述**：收藏表情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | emoji_id | string | 是 | 表情ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "收藏成功"
  }
  ```

#### 11.5 取消收藏表情

- **路径**：`POST /api/emojis/unfavorite`
- **描述**：取消收藏表情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | emoji_id | string | 是 | 表情ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "取消收藏成功"
  }
  ```

#### 11.6 获取用户收藏的表情

- **路径**：`GET /api/emojis/favorites`
- **描述**：获取用户收藏的表情
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "表情ID",
        "name": "表情名称",
        "url": "表情图片URL",
        "category_id": "分类ID",
        "category_name": "分类名称"
      }
    ]
  }
  ```

### 12. 心情相关接口

#### 12.1 获取心情列表

- **路径**：`GET /api/moods`
- **描述**：获取心情列表
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "心情ID",
        "name": "心情名称",
        "icon": "心情图标",
        "color": "心情颜色",
        "sort": 1
      }
    ]
  }
  ```

#### 12.2 记录心情

- **路径**：`POST /api/moods/record`
- **描述**：记录用户当前心情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | mood_id | string | 是 | 心情ID |
  | content | string | 否 | 心情备注 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "心情记录成功"
  }
  ```

#### 12.3 获取用户心情记录

- **路径**：`GET /api/moods/records`
- **描述**：获取用户心情记录
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | start_date | string | 否 | 开始日期（YYYY-MM-DD） |
  | end_date | string | 否 | 结束日期（YYYY-MM-DD） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "记录ID",
        "mood_id": "心情ID",
        "mood_name": "心情名称",
        "mood_icon": "心情图标",
        "content": "心情备注",
        "created_at": "记录时间"
      }
    ]
  }
  ```

### 13. 话题相关接口

#### 13.1 获取推荐话题

- **路径**：`GET /api/topics`
- **描述**：根据天气、心情等条件获取推荐话题
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | weather | string | 否 | 天气 |
  | mood | string | 否 | 心情 |
  | limit | number | 否 | 限制数量（默认5） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "话题ID",
        "title": "话题标题",
        "content": "话题内容",
        "weather": "天气",
        "mood": "心情",
        "tags": ["标签1", "标签2"]
      }
    ]
  }
  ```

### 14. 广场相关接口

#### 14.1 获取推荐内容

- **路径**：`GET /api/square/recommend`
- **描述**：根据热度评分获取推荐内容
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认10） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "内容ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "内容标题",
        "content": "内容正文",
        "cover": "封面图片URL",
        "images": ["图片1URL", "图片2URL"],
        "tags": ["标签1", "标签2"],
        "location": "地点",
        "created_at": "创建时间",
        "stats": {
          "like_count": 24,
          "comment_count": 12,
          "share_count": 3
        },
        "is_liked": true,
        "is_followed": false
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10
    }
  }
  ```

#### 14.2 获取热门内容

- **路径**：`GET /api/square/hot`
- **描述**：根据点赞数或评论数获取热门内容
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------------------------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认10） |
  | sort_by | string | 否 | 排序方式：likes（点赞）或 comments（评论） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "内容ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "内容标题",
        "content": "内容正文",
        "cover": "封面图片URL",
        "images": ["图片1URL", "图片2URL"],
        "tags": ["标签1", "标签2"],
        "location": "地点",
        "created_at": "创建时间",
        "stats": {
          "like_count": 24,
          "comment_count": 12,
          "share_count": 3
        },
        "is_liked": true,
        "is_followed": false
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10
    }
  }
  ```

#### 14.3 获取最新内容

- **路径**：`GET /api/square/latest`
- **描述**：根据发布时间获取最新内容
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认10） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "内容ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "内容标题",
        "content": "内容正文",
        "cover": "封面图片URL",
        "images": ["图片1URL", "图片2URL"],
        "tags": ["标签1", "标签2"],
        "location": "地点",
        "created_at": "创建时间",
        "stats": {
          "like_count": 24,
          "comment_count": 12,
          "share_count": 3
        },
        "is_liked": true,
        "is_followed": false
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10
    }
  }
  ```

#### 14.4 获取广场列表

- **路径**：`GET /api/square`
- **描述**：获取广场内容列表
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认20） |
  | sort | string | 否 | 排序字段 |
  | tag | string | 否 | 标签筛选 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "内容ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "内容标题",
        "content": "内容正文",
        "cover": "封面图片URL",
        "images": ["图片1URL", "图片2URL"],
        "tags": ["标签1", "标签2"],
        "location": "地点",
        "created_at": "创建时间",
        "stats": {
          "like_count": 24,
          "comment_count": 12,
          "share_count": 3
        },
        "is_liked": true,
        "is_followed": false
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20
    }
  }
  ```

#### 14.5 获取广场详情

- **路径**：`GET /api/square/detail/{id}`
- **描述**：获取广场内容详情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 评论页码（默认1） |
  | per_page | number | 否 | 评论每页数量（默认20） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "id": "内容ID",
      "title": "内容标题",
      "content": "内容正文",
      "images": ["图片1URL", "图片2URL"],
      "tags": ["标签1", "标签2"],
      "diary_date": "2023-01-01",
      "author": {
        "id": "用户ID",
        "nickname": "昵称",
        "avatar": "头像URL",
        "bio": "个人简介",
        "follower_count": 10,
        "is_followed": false
      },
      "stats": {
        "like_count": 24,
        "comment_count": 12,
        "share_count": 3,
        "view_count": 100
      },
      "is_liked": false,
      "is_favorited": false,
      "is_owner": false,
      "comments": {
        "total": 12,
        "page": 1,
        "per_page": 20,
        "items": [
          {
            "id": "评论ID",
            "user": {
              "id": "用户ID",
              "nickname": "昵称",
              "avatar": "头像URL"
            },
            "content": "评论内容",
            "created_at": "评论时间"
          }
        ]
      },
      "recommendations": [
        {
          "id": "推荐内容ID",
          "title": "推荐内容标题",
          "author": {
            "nickname": "昵称",
            "avatar": "头像URL"
          },
          "like_count": 10
        }
      ]
    }
  }
  ```

### 15. 标签相关接口

#### 15.1 获取标签列表

- **路径**：`GET /api/tags`
- **描述**：获取标签列表，支持全局和用户特定标签
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | type | string | 否 | 标签类型：global（全局）或 user（用户），默认为 global |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认20） |
  | sort | string | 否 | 排序字段：use_count（使用次数）或 created_at（创建时间），默认为 use_count |
  | order | string | 否 | 排序方向：desc（降序）或 asc（升序），默认为 desc |
  | search | string | 否 | 搜索关键词 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "标签ID",
        "name": "标签名称",
        "use_count": 100,
        "created_at": "创建时间"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 100
    }
  }
  ```

#### 15.2 获取标签详情

- **路径**：`GET /api/tags/{id}`
- **描述**：获取标签详细信息
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | id | string | 是 | 标签ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "id": "标签ID",
      "name": "标签名称",
      "use_count": 100,
      "created_at": "创建时间",
      "updated_at": "更新时间"
    }
  }
  ```

#### 15.3 搜索标签

- **路径**：`GET /api/tags/search`
- **描述**：搜索标签，用于自动完成
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | q | string | 是 | 搜索关键词 |
  | limit | number | 否 | 返回数量限制（默认10） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "标签ID",
        "name": "标签名称",
        "use_count": 100
      }
    ]
  }
  ```

### 16. 广告相关接口

#### 16.1 记录广告点击

- **路径**：`POST /api/ads/click`
- **描述**：记录用户广告点击
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | ad_id | string | 是 | 广告ID |
  | ad_type | string | 是 | 广告类型 |
  | duration | number | 是 | 点击时长 |
  | app_id | string | 否 | 应用ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "广告点击记录成功"
  }
  ```

#### 16.2 获取广告点击统计

- **路径**：`GET /api/ads/stats`
- **描述**：获取用户广告点击统计数据
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total_clicks": 10,
      "total_duration": 300,
      "ad_type_stats": {
        "banner": 5,
        "interstitial": 3,
        "rewarded": 2
      }
    }
  }
  ```

#### 16.3 获取广告点击列表

- **路径**：`GET /api/ads/clicks`
- **描述**：获取广告点击记录列表
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | per_page | number | 否 | 每页数量（默认20） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "记录ID",
        "ad_id": "广告ID",
        "ad_type": "广告类型",
        "duration": 30,
        "ip": "用户IP",
        "created_at": "点击时间"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total": 10
    }
  }
  ```

#### 16.4 获取所有用户广告统计（管理员）

- **路径**：`GET /api/admin/ads/stats`
- **描述**：获取所有用户的广告点击统计信息，仅管理员可用
- **认证**：需要JWT Token，且角色为admin或superadmin
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | start_date | string | 否 | 开始日期（ISO格式） |
  | end_date | string | 否 | 结束日期（ISO格式） |
  | user_id | string | 否 | 特定用户ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total_clicks": 100,
      "click_stats": [
        {
          "_id": "banner",
          "count": 50,
          "total_duration": 1500
        }
      ],
      "user_stats": [
        {
          "_id": "用户ID",
          "user_uuid": "用户UUID",
          "app_id": "应用ID",
          "count": 20,
          "total_duration": 600
        }
      ],
      "recent_clicks": [
        {
          "id": "记录ID",
          "user_id": {
            "username": "用户名",
            "nickname": "昵称",
            "avatar": "头像URL"
          },
          "user_uuid": "用户UUID",
          "app_id": "应用ID",
          "ad_id": "广告ID",
          "ad_type": "广告类型",
          "duration": 30,
          "ip": "用户IP",
          "created_at": "点击时间"
        }
      ]
    }
  }
  ```

### 17. 统计相关接口

#### 17.1 开始用户会话

- **路径**：`POST /api/stats/session/start`
- **描述**：开始用户会话
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | session_id | string | 是 | 会话ID |
  | enter_page | string | 是 | 进入页面 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "会话开始成功"
  }
  ```

#### 17.2 结束用户会话

- **路径**：`POST /api/stats/session/end`
- **描述**：结束用户会话
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | session_id | string | 是 | 会话ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "会话结束成功"
  }
  ```

#### 17.3 发送心跳

- **路径**：`POST /api/stats/heartbeat`
- **描述**：发送会话心跳，保持会话活跃
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | session_id | string | 是 | 会话ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "心跳发送成功"
  }
  ```

#### 17.4 报告广告行为

- **路径**：`POST /api/stats/ad/action`
- **描述**：报告广告行为
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | ad_id | string | 是 | 广告ID |
  | ad_type | string | 是 | 广告类型 |
  | action | string | 是 | 行为类型：request（请求）、exposure（曝光）、click（点击）、play_complete（播放完成） |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "广告行为报告成功"
  }
  ```

#### 17.5 获取用户统计

- **路径**：`GET /api/stats/user`
- **描述**：获取用户统计数据
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total_session_time": 3600,
      "total_sessions": 10,
      "average_session_time": 360,
      "ad_request_count": 50,
      "ad_exposure_count": 45,
      "ad_click_count": 10,
      "ad_play_complete_count": 8
    }
  }
  ```

### 18. 广告收益相关接口

#### 18.1 获取任务信息

- **路径**：`GET /api/ad/task-info`
- **描述**：获取广告任务信息，包括每日限制、已观看次数、已获得收益等
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "daily_limit": 10,
      "today_watched": 5,
      "reward_per_ad": 0.1,
      "today_earned": 0.5,
      "today_potential": 1.0,
      "total_earned": 12.34,
      "available": 8.45
    }
  }
  ```

#### 18.2 记录广告观看

- **路径**：`POST /api/ad/watch`
- **描述**：记录广告观看并获得收益
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | ad_id | string | 是 | 广告ID |
  | duration | number | 是 | 观看时长（秒） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "reward": 0.1,
      "today_earned": 0.6,
      "today_left": 4,
      "total_earned": 12.44
    }
  }
  ```

#### 18.3 获取每日收益历史

- **路径**：`GET /api/ad/earnings/daily`
- **描述**：按天获取用户的收益历史记录
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | page_size | number | 否 | 每页数量（默认20） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total": 30,
      "items": [
        {
          "date": "2023-01-01",
          "earned": 0.8,
          "watch_count": 8
        }
      ]
    }
  }
  ```

#### 18.4 获取详细收益历史

- **路径**：`GET /api/ad/earnings/detail`
- **描述**：获取用户的广告观看明细记录
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | page | number | 否 | 页码（默认1） |
  | page_size | number | 否 | 每页数量（默认20） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total": 100,
      "items": [
        {
          "id": "记录ID",
          "ad_id": "广告ID",
          "reward": 0.1,
          "watch_time": "2023-01-01 10:30:00"
        }
      ]
    }
  }
  ```




### 19. 日记分析相关接口

#### 19.1 获取单篇日记分析结果

- **路径**：`GET /api/analysis/diary/{diary_id}`
- **描述**：获取指定日记的分析结果，如果没有分析结果会立即进行分析
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----- | ------ | -- | -------------- |
  | diary_id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "_id": "分析ID",
      "diary_id": "日记ID",
      "user_id": "用户ID",
      "sentiment": "positive",
      "sentiment_score": 0.5,
      "topics": ["生活", "工作"],
      "keywords": ["开心", "周末", "朋友"],
      "word_count": 500,
      "sentence_count": 10,
      "avg_sentence_length": 50.0,
      "created_at": "创建时间",
      "updated_at": "更新时间"
    }
  }
  ```

#### 19.2 重新分析日记

- **路径**：`POST /api/analysis/diary/{diary_id}`
- **描述**：重新分析指定日记
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----- | ------ | -- | -------------- |
  | diary_id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "分析成功",
    "data": {
      "_id": "分析ID",
      "diary_id": "日记ID",
      "user_id": "用户ID",
      "sentiment": "positive",
      "sentiment_score": 0.5,
      "topics": ["生活", "工作"],
      "keywords": ["开心", "周末", "朋友"],
      "word_count": 500,
      "sentence_count": 10,
      "avg_sentence_length": 50.0
    }
  }
  ```

#### 19.3 获取用户分析概览

- **路径**：`GET /api/analysis/overview` 或 `GET /api/user/analysis/overview`
- **描述**：获取用户的日记分析概览，包括情感分布、主题统计、写作习惯、关怀语录等
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total_diaries": 50,
      "total_words": 25000,
      "avg_sentiment": 0.25,
      "positive_ratio": 0.6,
      "neutral_ratio": 0.3,
      "negative_ratio": 0.1,
      "top_topics": [
        {"topic": "生活", "count": 30},
        {"topic": "工作", "count": 15},
        {"topic": "旅行", "count": 5}
      ],
      "top_keywords": [
        {"word": "开心", "count": 25},
        {"word": "周末", "count": 20},
        {"word": "朋友", "count": 15}
      ],
      "writing_times": {
        "morning": 10,
        "afternoon": 15,
        "evening": 20,
        "night": 5
      },
      "caring_message": "今天的你看起来心情不错呢！愿这份快乐延续到每一天 🌞",
      "streak_tips": "你已经连续记录7天啦！坚持是件了不起的事 🌟",
      "topic_tip": "工作压力是暂时的，记得照顾好自己 💼",
      "streak": 7
    }
  }
  ```

#### 19.4 获取情感趋势

- **路径**：`GET /api/analysis/sentiment-trend` 或 `GET /api/user/analysis/sentiment-trend`
- **描述**：获取用户的情感趋势数据，支持按天、周、月统计
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------------------------- |
  | type | string | 否 | 统计类型：day（天）、week（周）、month（月），默认day |
  | range | number | 否 | 统计数量，默认30 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "labels": ["2023-01-01", "2023-01-02", "2023-01-03"],
      "values": [0.5, 0.3, -0.2],
      "diary_counts": [1, 2, 1]
    }
  }
  ```

#### 19.5 获取主题情感关联

- **路径**：`GET /api/analysis/topic-sentiment`
- **描述**：获取用户各个主题的情感分布
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "topic": "生活",
        "positive": 20,
        "neutral": 8,
        "negative": 2,
        "avg": 0.45
      },
      {
        "topic": "工作",
        "positive": 5,
        "neutral": 6,
        "negative": 4,
        "avg": -0.1
      }
    ]
  }
  ```

#### 19.6 获取词云数据

- **路径**：`GET /api/analysis/wordcloud` 或 `GET /api/user/analysis/wordcloud`
- **描述**：获取用户的关键词词云数据
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------------------------- |
  | limit | number | 否 | 返回关键词数量，默认50 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {"word": "开心", "weight": 1.0},
      {"word": "周末", "weight": 0.8},
      {"word": "朋友", "weight": 0.6}
    ]
  }
  ```

#### 19.7 获取写作习惯

- **路径**：`GET /api/user/analysis/writing-habit`
- **描述**：获取用户的写作时段分布
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "writing_times": {
        "morning": 10,
        "afternoon": 15,
        "evening": 20,
        "night": 5
      },
      "total_diaries": 50
    }
  }
  ```

#### 19.8 按标签分析日记

- **路径**：`POST /api/analysis/tag`
- **描述**：按指定标签分析相关日记
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | tags | array | 是 | 标签数组 |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "tags": ["生活", "工作"],
      "total_diaries": 20,
      "avg_sentiment": 0.25,
      "sentiment_distribution": {
        "positive": 12,
        "neutral": 5,
        "negative": 3
      },
      "top_keywords": [
        {"word": "开心", "count": 10},
        {"word": "周末", "count": 8}
      ],
      "top_topics": [
        {"topic": "生活", "count": 15},
        {"topic": "工作", "count": 5}
      ],
      "diaries": [
        {
          "id": "日记ID",
          "title": "日记标题",
          "content": "日记内容...",
          "diary_date": "2023-01-01",
          "mood": "开心",
          "weather": "晴天",
          "tags": ["生活", "工作"],
          "analysis": {
            "sentiment": "positive",
            "sentiment_score": 0.5
          }
        }
      ]
    }
  }
  ```

#### 19.9 刷新关怀语录

- **路径**：`POST /api/analysis/caring-message/refresh`
- **描述**：刷新当前用户的关怀语录
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------------------------- |
  | sentiment | string | 否 | 情感类型：positive、neutral、negative |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": "别难过，明天会更好 💪"
  }
  ```

