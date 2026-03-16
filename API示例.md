# API 接口测试示例

基础信息：
- 基础URL: http://localhost:3000
- 认证方式: Bearer Token
- 请求格式: JSON

---

## 1. 测试接口

### 测试连接
```bash
curl -X GET http://localhost:3000/api/test
```

---

## 用户相关接口

## 用户登录

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456"
  }'

```

---

## 用户注册

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "123456",
    "nickname": "新用户",
    "code": "123456"
  }'

```

发送验证码

```bash
curl -X POST http://localhost:3000/api/users/send-code \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "type": "register"
  }'

```

获取用户信息（需要登录）

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

更新用户信息（需要登录）

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar.jpg"
  }'

```

重置密码

```bash
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "newpassword123"
  }'

```

微信登录

```bash
curl -X POST http://localhost:3000/api/users/wechat-login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WECHAT_CODE_HERE"
  }'

```

微信绑定

```bash
curl -X POST http://localhost:3000/api/users/wechat-bind \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WECHAT_CODE_HERE"
  }'

```

获取用户统计（需要登录）

```bash
curl -X GET http://localhost:3000/api/users/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

## 日记相关接口

获取日记列表（需要登录）

```bash
curl -X GET "http://localhost:3000/api/diaries?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

创建日记（需要登录）

```bash
curl -X POST http://localhost:3000/api/diaries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇日记",
    "content": "今天天气真好！",
    "diary_date": "2026-03-14",
    "weather": "晴天",
    "mood": "开心",
    "location": "北京",
    "tags": ["生活", "日常"]
  }'

```

兼容格式1

```bash
curl -X POST http://localhost:3000/api/diaries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "等一下",
    "content": "你好\n\n爱睡觉跟大家说大好时机",
    "date": "2026-03-14T08:17:49.532Z",
    "emotion": 0,
    "location": "11",
    "tags": "工作"
  }'

```

获取日记详情（需要登录）

```bash
curl -X GET http://localhost:3000/api/diaries/DIARY_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

更新日记（需要登录）

```bash
curl -X PUT http://localhost:3000/api/diaries/DIARY_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题",
    "content": "更新后的内容"
  }'

```

删除日记（需要登录）

```bash
curl -X DELETE http://localhost:3000/api/diaries/DIARY_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取广场日记（需要登录）

```bash
curl -X GET "http://localhost:3000/api/diaries/square?page=1&pageSize=10&type=推荐" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

## 兑换码相关接口

使用兑换码（需要登录）

```bash
curl -X POST http://localhost:3000/api/redeem/use \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "REDEEM_CODE_HERE"
  }'

```

生成兑换码（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/redeem/generate \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "vip",
    "value": 30,
    "count": 5,
    "expireDays": 30
  }'

```

获取兑换码列表（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/redeem/codes?type=vip&isUsed=false" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

## 充值相关接口

充值VIP（需要登录）

```bash
curl -X POST http://localhost:3000/api/recharge/vip \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 30
  }'

```

充值SVIP（需要登录）

```bash
curl -X POST http://localhost:3000/api/recharge/svip \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 30
  }'

```

充值余额（需要登录）

```bash
curl -X POST http://localhost:3000/api/recharge/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100
  }'

```

获取充值记录（需要登录）

```bash
curl -X GET http://localhost:3000/api/recharge/records \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

## 文件相关接口

上传文件（需要登录）

```bash
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/file.jpg" \
  -F "description=文件描述" \
  -F "type=user_image"

```

获取用户上传的文件（需要登录）

```bash
curl -X GET http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

## 勋章相关接口

获取当前用户的勋章列表（需要登录）

```bash
curl -X GET http://localhost:3000/api/medals/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取所有勋章列表

```bash
curl -X GET http://localhost:3000/api/medals

```

获取单个勋章详情

```bash
curl -X GET http://localhost:3000/api/medals/MEDAL_ID_HERE

```

管理员手动颁发勋章（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/medals/award \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "medalId": "MEDAL_ID_HERE",
    "reason": "表现优异"
  }'

```

## 字典相关接口

获取所有字典（需要登录）

```bash
curl -X GET http://localhost:3000/api/dictionaries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取指定类型字典（需要登录）

```bash
curl -X GET http://localhost:3000/api/dictionaries/DICTIONARY_TYPE_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

创建字典（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/dictionaries \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather",
    "items": [{"key": "sunny", "value": "晴天", "description": "晴天"}]
  }'

```

更新字典（管理员，需要登录）

```bash
curl -X PUT http://localhost:3000/api/admin/dictionaries/DICTIONARY_TYPE_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"key": "sunny", "value": "晴天", "description": "晴天"}]
  }'

```

删除字典（管理员，需要登录）

```bash
curl -X DELETE http://localhost:3000/api/admin/dictionaries/DICTIONARY_TYPE_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

## 表情包相关接口

获取表情包分类列表

```bash
curl -X GET http://localhost:3000/api/emoji/categories

```

获取表情包列表（可选登录）

```bash
curl -X GET "http://localhost:3000/api/emojis?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

按分类获取表情包

```bash
curl -X GET "http://localhost:3000/api/emojis?category_id=CATEGORY_ID_HERE&page=1&page_size=20"

```

搜索表情包

```bash
curl -X GET "http://localhost:3000/api/emojis?keyword=开心&page=1&page_size=20"

```

获取表情包详情

```bash
curl -X GET http://localhost:3000/api/emojis/EMOJI_UUID_HERE

```

获取热门表情

```bash
curl -X GET http://localhost:3000/api/emojis/trending

```

获取用户收藏的表情包（需要登录）

```bash
curl -X GET "http://localhost:3000/api/user/emojis/favorites?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

收藏/取消收藏表情包（需要登录）

```bash
curl -X POST http://localhost:3000/api/user/emojis/favorite \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "emoji_uuid": "EMOJI_UUID_HERE"
  }'

```

记录表情使用（需要登录）

```bash
curl -X POST http://localhost:3000/api/user/emojis/usage \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "emoji_uuid": "EMOJI_UUID_HERE"
  }'

```

获取用户最近使用的表情（需要登录）

```bash
curl -X GET "http://localhost:3000/api/user/emojis/recent?limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取用户自定义表情包（需要登录）

```bash
curl -X GET http://localhost:3000/api/user/emojis/custom \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

删除自定义表情包（需要登录）

```bash
curl -X DELETE http://localhost:3000/api/user/emojis/custom/CUSTOM_EMOJI_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

创建官方表情包（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/emojis \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "开心",
    "description": "开心表情",
    "type": 1,
    "url": "https://example.com/emoji.png",
    "thumbnail_url": "https://example.com/emoji_thumb.png",
    "tags": ["开心", "快乐"]
  }'

```

更新表情包（管理员，需要登录）

```bash
curl -X PUT http://localhost:3000/api/admin/emojis/EMOJI_UUID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "更新后的表情名称"
  }'

```

删除表情包（管理员，需要登录）

```bash
curl -X DELETE http://localhost:3000/api/admin/emojis/EMOJI_UUID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

创建表情分类（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/emoji/categories \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "热门推荐",
    "icon": "/static/icons/hot.png",
    "sort_order": 1
  }'

```

## 广场相关接口

获取推荐日记（需要登录）

```bash
curl -X GET "http://localhost:3000/api/square/recommend?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取热门日记（需要登录）

```bash
curl -X GET "http://localhost:3000/api/square/hot?page=1&per_page=10&sort_by=likes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取最新日记（需要登录）

```bash
curl -X GET "http://localhost:3000/api/square/latest?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取关注用户的日记（需要登录）

```bash
curl -X GET "http://localhost:3000/api/square/following?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

获取同城日记（需要登录）

```bash
curl -X GET "http://localhost:3000/api/square/local?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

点赞日记（需要登录）

```bash
curl -X POST http://localhost:3000/api/square/like \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "diary_id": "DIARY_ID_HERE"
  }'

```

取消点赞（需要登录）

```bash
curl -X POST http://localhost:3000/api/square/unlike \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "diary_id": "DIARY_ID_HERE"
  }'

```

评论日记（需要登录）

```bash
curl -X POST http://localhost:3000/api/square/comment \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "diary_id": "DIARY_ID_HERE",
    "content": "写得真好！"
  }'

```

关注用户（需要登录）

```bash
curl -X POST http://localhost:3000/api/square/follow \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE"
  }'

```

取消关注（需要登录）

```bash
curl -X POST http://localhost:3000/api/square/unfollow \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE"
  }'

```

获取日记详情（需要登录）

```bash
curl -X GET "http://localhost:3000/api/square/detail/DIARY_ID_HERE?page=1&per_page=20" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

```

## 导出导入相关接口

导出用户数据（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/export/users?format=json&limit=0" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

导入用户数据（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/import/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -F "file=@/path/to/users.json"

```

导出字典数据（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/export/dictionaries?format=json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

导出勋章数据（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/export/medals?format=json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

导出充值记录（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/export/recharge-records?format=json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

导出兑换码（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/export/redeem-codes?format=json" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

导入字典数据（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/import/dictionaries \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -F "file=@/path/to/dictionaries.json"

```

导入勋章数据（管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/import/medals \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -F "file=@/path/to/medals.json"

```

## 管理后台接口

获取所有用户（管理员，需要登录）

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

更新用户角色（管理员，需要登录）

```bash
curl -X PUT http://localhost:3000/api/users/USER_ID_HERE/role \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "role": 1
  }'

```

获取所有日记（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/diaries?page=1&per_page=10" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

获取日记详情（管理员，需要登录）

```bash
curl -X GET http://localhost:3000/api/admin/diaries/DIARY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

删除日记（管理员，需要登录）

```bash
curl -X DELETE http://localhost:3000/api/admin/diaries/DIARY_ID_HERE \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

获取所有充值记录（管理员，需要登录）

```bash
curl -X GET "http://localhost:3000/api/admin/recharge/records?page=1&per_page=10" \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

获取所有上传的文件（管理员，需要登录）

```bash
curl -X GET http://localhost:3000/api/admin/files/list \
  -H "Authorization: Bearer ADMIN_TOKEN_HERE"

```

获取管理员列表（超级管理员，需要登录）

```bash
curl -X GET http://localhost:3000/api/admin/superadmin/admins \
  -H "Authorization: Bearer SUPERADMIN_TOKEN_HERE"

```

创建管理员（超级管理员，需要登录）

```bash
curl -X POST http://localhost:3000/api/admin/superadmin/admins \
  -H "Authorization: Bearer SUPERADMIN_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin2",
    "email": "admin2@example.com",
    "password": "123456"
  }'

```

启用管理员账号（超级管理员，需要登录）

```bash
curl -X PUT http://localhost:3000/api/admin/superadmin/admins/ADMIN_ID_HERE/activate \
  -H "Authorization: Bearer SUPERADMIN_TOKEN_HERE"

```

停用管理员账号（超级管理员，需要登录）

```bash
curl -X PUT http://localhost:3000/api/admin/superadmin/admins/ADMIN_ID_HERE/deactivate \
  -H "Authorization: Bearer SUPERADMIN_TOKEN_HERE"

```

删除管理员（超级管理员，需要登录）

```bash
curl -X DELETE http://localhost:3000/api/admin/superadmin/admins/ADMIN_ID_HERE \
  -H "Authorization: Bearer SUPERADMIN_TOKEN_HERE"

```

---

## 使用说明

1. 替换 `YOUR_TOKEN_HERE` 为实际的JWT令牌
2. 替换 `ADMIN_TOKEN_HERE` 为管理员令牌
3. 替换 `SUPERADMIN_TOKEN_HERE` 为超级管理员令牌
4. 替换其他ID参数为实际的ID值
5. 文件上传接口需要替换文件路径为实际路径
6. 默认端口为3000，根据实际情况修改

