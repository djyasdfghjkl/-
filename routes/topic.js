const Router = require('koa-router');
const auth = require('../middleware/auth');
const { role } = require('../middleware/role');
const Topic = require('../models/Topic');

const router = new Router();
const adminRouter = new Router();

/**
 * @swagger
 * /api/topics: 
 *   get:
 *     summary: 获取推荐话题
 *     description: 根据天气、心情等条件获取推荐话题
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weather
 *         schema:
 *           type: string
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get('/topics', auth, async (ctx) => {
  try {
    const { weather, mood, limit = 5 } = ctx.query;
    
    const query = {
      is_active: true
    };
    
    // 根据天气过滤
    if (weather) {
      query.weather = weather;
    }
    
    // 根据心情过滤
    if (mood) {
      query.mood = mood;
    }
    
    // 获取当前日期信息
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    
    // 优先获取匹配当前月份和日期的话题
    const topics = await Topic.find(query)
      .sort({
        month: month === query.month ? -1 : 1,
        day: day === query.day ? -1 : 1,
        created_at: -1
      })
      .limit(parseInt(limit));
    
    ctx.body = {
      success: true,
      data: topics
    };
  } catch (error) {
    console.error('[获取推荐话题错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取推荐话题失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/topics:
 *   post:
 *     summary: 创建推荐话题
 *     description: 创建新的推荐话题
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title: 
 *                 type: string
 *               content: 
 *                 type: string
 *               weather: 
 *                 type: string
 *               mood: 
 *                 type: string
 *               tags: 
 *                 type: array
 *                 items: 
 *                   type: string
 *               season: 
 *                 type: string
 *                 enum: [spring, summer, autumn, winter]
 *               month: 
 *                 type: number
 *                 min: 1
 *                 max: 12
 *               day: 
 *                 type: number
 *                 min: 1
 *                 max: 31
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
adminRouter.post('/topics', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { title, content, weather, mood, tags, season, month, day } = ctx.request.body;
    
    if (!title || !content) {
      ctx.status = 400;
      ctx.body = { success: false, message: '标题和内容不能为空' };
      return;
    }
    
    const newTopic = new Topic({
      title,
      content,
      weather,
      mood,
      tags,
      season,
      month,
      day
    });
    
    await newTopic.save();
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: '话题创建成功',
      data: newTopic
    };
  } catch (error) {
    console.error('[创建推荐话题错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '创建推荐话题失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/topics:
 *   get:
 *     summary: 获取话题列表
 *     description: 获取所有推荐话题列表
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: weather
 *         schema:
 *           type: string
 *       - in: query
 *         name: mood
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 */
adminRouter.get('/topics', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { page = 1, per_page = 10, weather, mood } = ctx.query;
    
    const query = {};
    
    if (weather) {
      query.weather = weather;
    }
    
    if (mood) {
      query.mood = mood;
    }
    
    const total = await Topic.countDocuments(query);
    const topics = await Topic.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * per_page)
      .limit(parseInt(per_page));
    
    ctx.body = {
      success: true,
      data: topics,
      pagination: {
        total,
        page: parseInt(page),
        per_page: parseInt(per_page),
        total_pages: Math.ceil(total / per_page)
      }
    };
  } catch (error) {
    console.error('[获取话题列表错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取话题列表失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/topics/{id}:
 *   put:
 *     summary: 更新推荐话题
 *     description: 更新指定的推荐话题
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: 
 *                 type: string
 *               content: 
 *                 type: string
 *               weather: 
 *                 type: string
 *               mood: 
 *                 type: string
 *               tags: 
 *                 type: array
 *                 items: 
 *                   type: string
 *               season: 
 *                 type: string
 *                 enum: [spring, summer, autumn, winter]
 *               month: 
 *                 type: number
 *                 min: 1
 *                 max: 12
 *               day: 
 *                 type: number
 *                 min: 1
 *                 max: 31
 *               is_active: 
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 话题不存在
 */
adminRouter.put('/topics/:id', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { id } = ctx.params;
    const updateData = ctx.request.body;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      ctx.status = 404;
      ctx.body = { success: false, message: '话题不存在' };
      return;
    }
    
    Object.assign(topic, updateData);
    await topic.save();
    
    ctx.body = {
      success: true,
      message: '话题更新成功',
      data: topic
    };
  } catch (error) {
    console.error('[更新推荐话题错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '更新推荐话题失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/topics/{id}:
 *   delete:
 *     summary: 删除推荐话题
 *     description: 删除指定的推荐话题
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
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 话题不存在
 */
adminRouter.delete('/topics/:id', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { id } = ctx.params;
    
    const topic = await Topic.findById(id);
    if (!topic) {
      ctx.status = 404;
      ctx.body = { success: false, message: '话题不存在' };
      return;
    }
    
    await topic.remove();
    
    ctx.body = {
      success: true,
      message: '话题删除成功'
    };
  } catch (error) {
    console.error('[删除推荐话题错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '删除推荐话题失败：' + error.message };
  }
});

// 注册路由前缀
router.prefix('/api');
adminRouter.prefix('/api/admin');

module.exports = {
  router,
  adminRouter
};