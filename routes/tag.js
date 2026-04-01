const Router = require('koa-router');
const auth = require('../middleware/auth');
const { role } = require('../middleware/role');
const Tag = require('../models/Tag');
const UserTag = require('../models/UserTag');
const DiaryTag = require('../models/DiaryTag');
const Diary = require('../models/Diary');

const router = new Router();

/**
 * @swagger
 * /api/tags: 
 *   get:
 *     summary: 获取标签列表
 *     description: 获取标签列表，支持全局热门和用户常用标签
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [global, user]
 *           default: global
 *         description: 标签类型，global为全局热门，user为用户常用
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: 当type=user时必传
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索标签名称
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: page_size
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页条数
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [hot, new, name]
 *           default: hot
 *         description: 排序方式，hot按使用次数，new按创建时间，name按名称
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/tags', auth, async (ctx) => {
  try {
    const { type = 'global', user_id, keyword, page = 1, page_size = 20, sort = 'hot' } = ctx.query;
    
    let query = {};
    
    // 关键词搜索
    if (keyword) {
      query.name = { $regex: keyword, $options: 'i' };
    }
    
    // 排序方式
    let sortOption = {};
    switch (sort) {
      case 'hot':
        sortOption = { use_count: -1 };
        break;
      case 'new':
        sortOption = { created_at: -1 };
        break;
      case 'name':
        sortOption = { name: 1 };
        break;
      default:
        sortOption = { use_count: -1 };
    }
    
    // 获取标签总数
    const total = await Tag.countDocuments(query);
    
    // 获取标签列表
    const tags = await Tag.find(query)
      .sort(sortOption)
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size));
    
    // 处理用户常用标签
    let tagList = tags;
    if (type === 'user' && user_id) {
      // 获取用户使用的标签及其使用次数
      const diaryIds = await Diary.find({ user_id }, '_id').then(diaries => diaries.map(d => d._id));
      const userTags = await DiaryTag.aggregate([
        {
          $match: {
            diary_id: { $in: diaryIds }
          }
        },
        {
          $group: {
            _id: '$tag_id',
            user_use_count: { $sum: 1 }
          }
        }
      ]);
      
      // 构建用户使用次数映射
      const userUseCountMap = {};
      userTags.forEach(ut => {
        userUseCountMap[ut._id.toString()] = ut.user_use_count;
      });
      
      // 为标签添加用户使用次数
      tagList = tags.map(tag => ({
        ...tag.toObject(),
        user_use_count: userUseCountMap[tag._id.toString()] || 0
      }));
    }
    
    ctx.body = {
      success: true,
      data: {
        total,
        page: parseInt(page),
        page_size: parseInt(page_size),
        items: tagList
      }
    };
  } catch (error) {
    console.error('[获取标签列表错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取标签列表失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/tags/{id}:
 *   get:
 *     summary: 获取标签详情
 *     description: 获取单个标签的详细信息
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 标签ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       404:
 *         description: 标签不存在
 */
router.get('/tags/:id', auth, async (ctx) => {
  try {
    const { id } = ctx.params;
    
    const tag = await Tag.findById(id);
    if (!tag) {
      ctx.status = 404;
      ctx.body = { success: false, message: '标签不存在' };
      return;
    }
    
    ctx.body = {
      success: true,
      data: tag
    };
  } catch (error) {
    console.error('[获取标签详情错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取标签详情失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/tags/search:
 *   get:
 *     summary: 搜索标签
 *     description: 搜索标签，用于前端输入时的自动补全
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 返回数量限制
 *     responses:
 *       200:
 *         description: 搜索成功
 *       401:
 *         description: 未认证
 */
router.get('/tags/search', auth, async (ctx) => {
  try {
    const { q, limit = 10 } = ctx.query;
    
    if (!q) {
      ctx.status = 400;
      ctx.body = { success: false, message: '搜索关键词不能为空' };
      return;
    }
    
    const tags = await Tag.find({ name: { $regex: q, $options: 'i' } })
      .sort({ use_count: -1 })
      .limit(parseInt(limit));
    
    ctx.body = {
      success: true,
      data: tags
    };
  } catch (error) {
    console.error('[搜索标签错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '搜索标签失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/user/tags:
 *   get:
 *     summary: 获取用户自定义标签列表
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/user/tags', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { keyword, page = 1, page_size = 50 } = ctx.query;

    const query = { user_id: user._id, status: 1 };
    if (keyword) query.name = { $regex: keyword, $options: 'i' };

    const total = await UserTag.countDocuments(query);
    const tags = await UserTag.find(query)
      .sort({ use_count: -1, created_at: -1 })
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size));

    ctx.body = { success: true, data: { total, items: tags } };
  } catch (error) {
    console.error('[获取用户标签列表错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取用户标签列表失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/user/tags:
 *   post:
 *     summary: 创建用户自定义标签
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/user/tags', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { name, color, icon } = ctx.request.body;

    if (!name) {
      ctx.status = 400;
      ctx.body = { success: false, message: '标签名称不能为空' };
      return;
    }

    const existing = await UserTag.findOne({ user_id: user._id, name, status: 1 });
    if (existing) {
      ctx.status = 400;
      ctx.body = { success: false, message: '标签名称已存在' };
      return;
    }

    const tag = new UserTag({ user_id: user._id, name, color, icon });
    await tag.save();

    ctx.status = 201;
    ctx.body = { success: true, message: '标签创建成功', data: tag };
  } catch (error) {
    console.error('[创建用户标签错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '创建标签失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/user/tags/{id}:
 *   put:
 *     summary: 修改用户自定义标签
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 修改成功
 */
router.put('/user/tags/:id', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const { name, color, icon } = ctx.request.body;

    const tag = await UserTag.findOne({ _id: id, user_id: user._id, status: 1 });
    if (!tag) {
      ctx.status = 404;
      ctx.body = { success: false, message: '标签不存在' };
      return;
    }

    if (name && name !== tag.name) {
      const existing = await UserTag.findOne({ user_id: user._id, name, status: 1, _id: { $ne: tag._id } });
      if (existing) {
        ctx.status = 400;
        ctx.body = { success: false, message: '标签名称已存在' };
        return;
      }
      tag.name = name;
    }
    if (color !== undefined) tag.color = color;
    if (icon !== undefined) tag.icon = icon;
    await tag.save();

    ctx.body = { success: true, message: '标签修改成功', data: tag };
  } catch (error) {
    console.error('[修改用户标签错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '修改标签失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/user/tags/{id}:
 *   delete:
 *     summary: 删除用户自定义标签
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
router.delete('/user/tags/:id', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const tag = await UserTag.findOne({ _id: id, user_id: user._id, status: 1 });
    if (!tag) {
      ctx.status = 404;
      ctx.body = { success: false, message: '标签不存在' };
      return;
    }

    tag.status = 0;
    await tag.save();

    ctx.body = { success: true, message: '标签删除成功' };
  } catch (error) {
    console.error('[删除用户标签错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '删除标签失败：' + error.message };
  }
});

// ==================== 管理员接口 ====================
const adminRouter = new Router();

/**
 * @swagger
 * /api/admin/tags:
 *   get:
 *     summary: 获取全局标签列表（管理员）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
adminRouter.get('/tags', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { keyword, page = 1, page_size = 20 } = ctx.query;
    const query = {};
    if (keyword) query.name = { $regex: keyword, $options: 'i' };

    const total = await Tag.countDocuments(query);
    const tags = await Tag.find(query)
      .sort({ use_count: -1 })
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size));

    ctx.body = { success: true, data: { total, items: tags } };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '获取标签列表失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/tags:
 *   post:
 *     summary: 创建全局标签（管理员）
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: 创建成功
 */
adminRouter.post('/tags', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { name } = ctx.request.body;
    if (!name) {
      ctx.status = 400;
      ctx.body = { success: false, message: '标签名称不能为空' };
      return;
    }
    const existing = await Tag.findOne({ name });
    if (existing) {
      ctx.status = 400;
      ctx.body = { success: false, message: '标签已存在' };
      return;
    }
    const tag = new Tag({ name });
    await tag.save();
    ctx.status = 201;
    ctx.body = { success: true, message: '标签创建成功', data: tag };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '创建标签失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/tags/{id}:
 *   delete:
 *     summary: 删除全局标签（管理员）
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
adminRouter.delete('/tags/:id', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { id } = ctx.params;
    const tag = await Tag.findByIdAndDelete(id);
    if (!tag) {
      ctx.status = 404;
      ctx.body = { success: false, message: '标签不存在' };
      return;
    }
    ctx.body = { success: true, message: '标签删除成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '删除标签失败：' + error.message };
  }
});

// 注册路由前缀
router.prefix('/api');
adminRouter.prefix('/api/admin');

module.exports = { router, adminRouter };