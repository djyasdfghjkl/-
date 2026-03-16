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

## 前端使用示例

### 1. 登录获取Token

```javascript
async function login(email, password) {
  const response = await fetch("http://localhost:3000/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem("token", data.data.token);
    return data.data.user;
  }
  throw new Error(data.message);
}
```

### 2. 使用Token访问需要认证的接口

```javascript
async function getUserProfile() {
  const token = localStorage.getItem("token");
  const response = await fetch("http://localhost:3000/api/users/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message);
}
```

### 3. 上传文件

```javascript
async function uploadFile(file, description, type) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);
  if (description) formData.append("description", description);
  if (type) formData.append("type", type);

  const response = await fetch("http://localhost:3000/api/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (data.success) {
    return data.data;
  }
  throw new Error(data.message);
}
```

## 注意事项

1. 所有需要认证的接口都需要在请求头中添加 `Authorization: Bearer {token}`
2. 文件上传接口使用 `multipart/form-data` 格式，其他接口使用 `application/json` 格式
3. 管理员接口需要相应的角色权限，否则会返回403错误
4. 接口返回的时间格式为ISO格式，前端需要根据需要进行格式化
5. 所有接口都有错误处理，前端需要捕获并处理错误情况

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

### 11. 广场相关接口

#### 11.1 获取推荐日记

- **路径**：`GET /api/square/recommend`
- **描述**：根据热度评分获取推荐日记
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
        "id": "日记ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "日记标题",
        "content": "日记内容",
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

#### 11.2 获取热门日记

- **路径**：`GET /api/square/hot`
- **描述**：根据点赞数或评论数获取热门日记
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
        "id": "日记ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "日记标题",
        "content": "日记内容",
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

#### 11.3 获取最新日记

- **路径**：`GET /api/square/latest`
- **描述**：根据发布时间获取最新日记
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
        "id": "日记ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "日记标题",
        "content": "日记内容",
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

#### 11.4 获取关注用户的日记

- **路径**：`GET /api/square/following`
- **描述**：获取当前用户关注的用户发布的公开日记
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
        "id": "日记ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "日记标题",
        "content": "日记内容",
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
        "is_followed": true
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 10
    }
  }
  ```

#### 11.5 获取同城日记

- **路径**：`GET /api/square/local`
- **描述**：获取与当前用户同城市的用户发布的公开日记
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
        "id": "日记ID",
        "user": {
          "id": "用户ID",
          "nickname": "昵称",
          "avatar": "头像URL"
        },
        "title": "日记标题",
        "content": "日记内容",
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

#### 11.6 点赞日记

- **路径**：`POST /api/square/like`
- **描述**：为指定日记点赞
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---- |
  | diary_id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "点赞成功",
    "data": {
      "like_count": 25,
      "is_liked": true
    }
  }
  ```

#### 11.7 取消点赞

- **路径**：`POST /api/square/unlike`
- **描述**：取消对指定日记的点赞
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---- |
  | diary_id | string | 是 | 日记ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "取消点赞成功",
    "data": {
      "like_count": 24,
      "is_liked": false
    }
  }
  ```

#### 11.8 评论日记

- **路径**：`POST /api/square/comment`
- **描述**：为指定日记添加评论
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---- |
  | diary_id | string | 是 | 日记ID |
  | content | string | 是 | 评论内容 |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "评论成功",
    "data": {
      "id": "评论ID",
      "user": {
        "id": "用户ID",
        "nickname": "昵称",
        "avatar": "头像URL"
      },
      "content": "评论内容",
      "created_at": "创建时间",
      "comment_count": 13
    }
  }
  ```

#### 11.9 关注用户

- **路径**：`POST /api/square/follow`
- **描述**：关注指定用户
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | ---- |
  | user_id | string | 是 | 用户ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "关注成功",
    "data": {
      "is_followed": true
    }
  }
  ```

#### 11.10 取消关注

- **路径**：`POST /api/square/unfollow`
- **描述**：取消对指定用户的关注
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -------- | ------ | -- | ---- |
  | user_id | string | 是 | 用户ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "取消关注成功",
    "data": {
      "is_followed": false
    }
  }
  ```

#### 11.11 获取日记详情

- **路径**：`GET /api/square/detail/{diary_id}`
- **描述**：获取指定日记的详细信息，包括作者信息、互动数据、评论列表和相关推荐
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ------------ |
  | diary_id | string | 是 | 日记ID |
  | page | number | 否 | 评论页码（默认1） |
  | per_page | number | 否 | 每页评论数量（默认20） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "id": "日记ID",
      "title": "日记标题",
      "content": "日记内容",
      "cover": "封面图片URL",
      "images": ["图片1URL", "图片2URL"],
      "tags": ["标签1", "标签2"],
      "weather": "晴天",
      "mood": "开心",
      "signature": "签名",
      "location": "地点",
      "created_at": "创建时间",
      "updated_at": "更新时间",
      "diary_date": "2023-01-01",
      "author": {
        "id": "作者ID",
        "nickname": "作者昵称",
        "avatar": "作者头像URL",
        "bio": "作者简介",
        "follower_count": 128,
        "is_followed": true
      },
      "stats": {
        "like_count": 24,
        "comment_count": 12,
        "share_count": 3,
        "view_count": 356
      },
      "is_liked": true,
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
              "nickname": "用户昵称",
              "avatar": "用户头像URL"
            },
            "content": "评论内容",
            "like_count": 5,
            "is_liked": false,
            "created_at": "评论时间",
            "reply_to": null
          }
        ]
      },
      "recommendations": [
        {
          "id": "推荐日记ID",
          "title": "推荐日记标题",
          "cover": "推荐日记封面URL",
          "author": {
            "nickname": "作者昵称",
            "avatar": "作者头像URL"
          },
          "like_count": 56
        }
      ]
    }
  }
  ```

#### 11.12 点赞评论

### 12. 心情相关接口

#### 12.1 获取心情列表

- **路径**：`GET /api/moods`
- **描述**：获取心情列表，支持分类、类型筛选和关键词搜索
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | category_id | number | 否 | 分类ID |
  | type | string | 否 | 心情类型：system（系统预设）、custom（自定义）、all（全部） |
  | keyword | string | 否 | 搜索关键词 |
  | page | number | 否 | 页码（默认1） |
  | page_size | number | 否 | 每页数量（默认20） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "total": 10,
      "items": [
        {
          "id": "心情UUID",
          "name": "开心",
          "description": "心情愉悦，充满快乐",
          "icon_type": 1,
          "icon_value": "😊",
          "is_system": true,
          "use_count": 1234,
          "user_use_count": 56
        }
      ]
    }
  }
  ```

#### 12.2 获取心情详情

- **路径**：`GET /api/moods/{uuid}`
- **描述**：根据UUID获取心情详情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | uuid | string | 是 | 心情UUID |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": {
      "id": "心情UUID",
      "name": "开心",
      "description": "心情愉悦，充满快乐",
      "icon_type": 1,
      "icon_value": "😊",
      "is_system": true,
      "use_count": 1234
    }
  }
  ```

#### 12.3 获取推荐心情

- **路径**：`GET /api/moods/recommend`
- **描述**：获取基于时间和使用频率的推荐心情
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "心情UUID",
        "name": "开心",
        "icon_type": 1,
        "icon_value": "😊",
        "is_system": true
      }
    ]
  }
  ```

#### 12.4 创建自定义心情

- **路径**：`POST /api/user/moods`
- **描述**：创建用户自定义心情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | name | string | 是 | 心情名称 |
  | description | string | 否 | 心情描述 |
  | icon_type | number | 是 | 图标类型：1=Emoji，2=内置表情包，3=自定义图片 |
  | icon_value | string | 是 | 图标值：Emoji字符、表情包ID或图片URL |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "自定义心情创建成功",
    "data": {
      "id": "心情UUID",
      "name": "困成狗",
      "description": "非常疲惫",
      "icon_type": 1,
      "icon_value": "🥱"
    }
  }
  ```

#### 12.5 修改自定义心情

- **路径**：`PUT /api/user/moods/{uuid}`
- **描述**：修改用户自定义心情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | --------- | ------ | -- | ---------- |
  | uuid | string | 是 | 心情UUID |
  | name | string | 否 | 心情名称 |
  | description | string | 否 | 心情描述 |
  | icon_type | number | 否 | 图标类型：1=Emoji，2=内置表情包，3=自定义图片 |
  | icon_value | string | 否 | 图标值：Emoji字符、表情包ID或图片URL |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "心情修改成功",
    "data": {
      "id": "心情UUID",
      "name": "超级困",
      "description": "非常疲惫",
      "icon_type": 1,
      "icon_value": "🥱"
    }
  }
  ```

#### 12.6 删除自定义心情

- **路径**：`DELETE /api/user/moods/{uuid}`
- **描述**：软删除用户自定义心情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | -- | ------ | -- | ---- |
  | uuid | string | 是 | 心情UUID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "心情删除成功"
  }
  ```

#### 12.7 获取用户自定义心情列表

- **路径**：`GET /api/user/moods/custom`
- **描述**：获取当前用户的自定义心情列表
- **认证**：需要JWT Token
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "心情UUID",
        "name": "困成狗",
        "description": "非常疲惫",
        "icon_type": 1,
        "icon_value": "🥱",
        "created_at": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
  ```

#### 12.8 获取用户常用心情

- **路径**：`GET /api/user/moods/frequent`
- **描述**：获取当前用户使用频率最高的心情
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ---- | ------ | -- | ---------- |
  | limit | number | 否 | 返回数量限制（默认5） |
- **返回结果**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "心情UUID",
        "name": "开心",
        "icon_type": 1,
        "icon_value": "😊",
        "is_system": true,
        "use_count": 20
      }
    ]
  }
  ```

#### 12.9 获取心情使用统计

- **路径**：`GET /api/moods/stats`
- **描述**：获取心情使用统计信息
- **认证**：需要JWT Token
- **返回结果**：

  ```json
  {
    "success": true,
    "data": {
      "global_hot": [
        {
          "id": "心情UUID",
          "name": "开心",
          "icon_type": 1,
          "icon_value": "😊",
          "use_count": 1234
        }
      ],
      "user_frequent": [
        {
          "id": "心情UUID",
          "name": "开心",
          "icon_type": 1,
          "icon_value": "😊",
          "use_count": 20
        }
      ]
    }
  }
  ```

- **路径**：`POST /api/square/comment/like`
- **描述**：为指定评论点赞
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----------- | ------ | -- | ---- |
  | comment_id | string | 是 | 评论ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "点赞成功",
    "data": {
      "like_count": 6,
      "is_liked": true
    }
  }
  ```

#### 11.13 取消评论点赞

- **路径**：`POST /api/square/comment/unlike`
- **描述**：取消对指定评论的点赞
- **认证**：需要JWT Token
- **参数**：
  | 字段 | 类型 | 必填 | 说明 |
  | ----------- | ------ | -- | ---- |
  | comment_id | string | 是 | 评论ID |
- **返回结果**：
  ```json
  {
    "success": true,
    "message": "取消点赞成功",
    "data": {
      "like_count": 5,
      "is_liked": false
    }
  }
  ```

## 前端使用示例

### 4. 导出数据

```javascript
async function exportData(type, format, limit = 0) {
  const token = localStorage.getItem("token");
  const url = new URL(`http://localhost:3000/api/admin/export/${type}`);
  if (format) url.searchParams.append("format", format);
  if (limit > 0) url.searchParams.append("limit", limit);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("导出失败");
  }

  const blob = await response.blob();
  const urlObject = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = urlObject;
  a.download = `${type}_${Date.now()}.${format || "json"}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(urlObject);
}

// 使用示例
exportData("users", "xlsx", 10); // 导出前10个用户为Excel格式
exportData("dictionaries", "json"); // 导出所有字典为JSON格式
```

### 5. 导入数据

```javascript
async function importData(type, file) {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `http://localhost:3000/api/admin/import/${type}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  const data = await response.json();
  if (data.success) {
    return data.message;
  }
  throw new Error(data.message);
}

// 使用示例
const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      const message = await importData("users", file);
      alert(message);
    } catch (error) {
      alert("导入失败: " + error.message);
    }
  }
});
```

## 错误码说明

| 错误码 | 说明                     |
| ------ | ------------------------ |
| 400    | 请求参数错误             |
| 401    | 未认证，需要登录         |
| 403    | 权限不足                 |
| 404    | 资源不存在               |
| 409    | 资源冲突（如邮箱已存在） |
| 500    | 服务器内部错误           |
| 503    | 数据库连接失败           |
