const Router = require('koa-router');
const router = new Router();
const auth = require('../middleware/auth');
const DiaryNotebook = require('../models/DiaryNotebook');

/**
 * @swagger
 * /api/notebooks:
 *   get:
 *     summary: 获取用户日记本列表
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
router.get('/notebooks', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const notebooks = await DiaryNotebook.find({ user_id: user._id, status: 1 })
      .sort({ is_default: -1, sort_order: -1, created_at: -1 });
    ctx.body = { success: true, data: notebooks };
  } catch (error) {
    console.error('[获取日记本列表错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取日记本列表失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/notebooks/{id}:
 *   get:
 *     summary: 获取日记本详情
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
 *         description: 获取成功
 */
router.get('/notebooks/:id', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const notebook = await DiaryNotebook.findOne({ _id: id, user_id: user._id, status: 1 });
    if (!notebook) {
      ctx.status = 404;
      ctx.body = { success: false, message: '日记本不存在' };
      return;
    }
    ctx.body = { success: true, data: notebook };
  } catch (error) {
    console.error('[获取日记本详情错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '获取日记本详情失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/notebooks:
 *   post:
 *     summary: 创建日记本
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
 *               cover_type:
 *                 type: integer
 *                 enum: [1, 2]
 *               bg_color:
 *                 type: string
 *               cover_image:
 *                 type: string
 *               text_color:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/notebooks', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { name, cover_type, bg_color, cover_image, text_color, description } = ctx.request.body;

    if (!name) {
      ctx.status = 400;
      ctx.body = { success: false, message: '日记本名称不能为空' };
      return;
    }

    // 检查是否已有默认日记本
    const hasDefault = await DiaryNotebook.exists({ user_id: user._id, is_default: true, status: 1 });

    const notebook = new DiaryNotebook({
      user_id: user._id,
      name,
      cover_type: cover_type || 1,
      bg_color: bg_color || '#FFFFFF',
      cover_image: cover_image || '',
      text_color: text_color || '#333333',
      description: description || '',
      is_default: !hasDefault,
    });

    await notebook.save();

    ctx.status = 201;
    ctx.body = { success: true, message: '日记本创建成功', data: notebook };
  } catch (error) {
    console.error('[创建日记本错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '创建日记本失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/notebooks/{id}:
 *   put:
 *     summary: 修改日记本
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
router.put('/notebooks/:id', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;
    const { name, cover_type, bg_color, cover_image, text_color, description, sort_order } = ctx.request.body;

    const notebook = await DiaryNotebook.findOne({ _id: id, user_id: user._id, status: 1 });
    if (!notebook) {
      ctx.status = 404;
      ctx.body = { success: false, message: '日记本不存在' };
      return;
    }

    if (name !== undefined) notebook.name = name;
    if (cover_type !== undefined) notebook.cover_type = cover_type;
    if (bg_color !== undefined) notebook.bg_color = bg_color;
    if (cover_image !== undefined) notebook.cover_image = cover_image;
    if (text_color !== undefined) notebook.text_color = text_color;
    if (description !== undefined) notebook.description = description;
    if (sort_order !== undefined) notebook.sort_order = sort_order;

    await notebook.save();

    ctx.body = { success: true, message: '日记本修改成功', data: notebook };
  } catch (error) {
    console.error('[修改日记本错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '修改日记本失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/notebooks/{id}/set-default:
 *   put:
 *     summary: 设置默认日记本
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
 *         description: 设置成功
 */
router.put('/notebooks/:id/set-default', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const notebook = await DiaryNotebook.findOne({ _id: id, user_id: user._id, status: 1 });
    if (!notebook) {
      ctx.status = 404;
      ctx.body = { success: false, message: '日记本不存在' };
      return;
    }

    // 取消其他默认
    await DiaryNotebook.updateMany({ user_id: user._id, is_default: true }, { is_default: false });
    notebook.is_default = true;
    await notebook.save();

    ctx.body = { success: true, message: '已设为默认日记本' };
  } catch (error) {
    console.error('[设置默认日记本错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '设置失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/notebooks/{id}:
 *   delete:
 *     summary: 删除日记本
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
router.delete('/notebooks/:id', auth, async (ctx) => {
  try {
    const user = ctx.state.user;
    const { id } = ctx.params;

    const notebook = await DiaryNotebook.findOne({ _id: id, user_id: user._id, status: 1 });
    if (!notebook) {
      ctx.status = 404;
      ctx.body = { success: false, message: '日记本不存在' };
      return;
    }

    if (notebook.is_default) {
      ctx.status = 400;
      ctx.body = { success: false, message: '默认日记本不能删除，请先设置其他日记本为默认' };
      return;
    }

    notebook.status = 0;
    await notebook.save();

    ctx.body = { success: true, message: '日记本删除成功' };
  } catch (error) {
    console.error('[删除日记本错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '删除日记本失败：' + error.message };
  }
});

// 管理员接口：为心情添加初始系统心情
const adminRouter = new Router();
const { role } = require('../middleware/role');
const Mood = require('../models/Mood');

/**
 * @swagger
 * /api/admin/moods:
 *   post:
 *     summary: 管理员创建系统心情
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
 *               - icon_type
 *               - icon_value
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon_type:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *               icon_value:
 *                 type: string
 *               sort_order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
adminRouter.post('/moods', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { name, description, icon_type, icon_value, sort_order } = ctx.request.body;

    if (!name || !icon_type || !icon_value) {
      ctx.status = 400;
      ctx.body = { success: false, message: '缺少必要参数' };
      return;
    }

    const existing = await Mood.findOne({ name, is_system: 1, status: 1 });
    if (existing) {
      ctx.status = 400;
      ctx.body = { success: false, message: '系统心情名称已存在' };
      return;
    }

    const mood = new Mood({
      name,
      description: description || '',
      icon_type,
      icon_value,
      is_system: 1,
      sort_order: sort_order || 0,
    });
    await mood.save();

    ctx.status = 201;
    ctx.body = { success: true, message: '系统心情创建成功', data: mood };
  } catch (error) {
    console.error('[管理员创建系统心情错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '创建系统心情失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/moods/{uuid}:
 *   put:
 *     summary: 管理员修改系统心情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 修改成功
 */
adminRouter.put('/moods/:uuid', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { uuid } = ctx.params;
    const { name, description, icon_type, icon_value, sort_order, status } = ctx.request.body;

    const mood = await Mood.findOne({ uuid, is_system: 1 });
    if (!mood) {
      ctx.status = 404;
      ctx.body = { success: false, message: '系统心情不存在' };
      return;
    }

    if (name !== undefined) mood.name = name;
    if (description !== undefined) mood.description = description;
    if (icon_type !== undefined) mood.icon_type = icon_type;
    if (icon_value !== undefined) mood.icon_value = icon_value;
    if (sort_order !== undefined) mood.sort_order = sort_order;
    if (status !== undefined) mood.status = status;

    await mood.save();
    ctx.body = { success: true, message: '系统心情修改成功', data: mood };
  } catch (error) {
    console.error('[管理员修改系统心情错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '修改系统心情失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/moods/{uuid}:
 *   delete:
 *     summary: 管理员删除系统心情
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
adminRouter.delete('/moods/:uuid', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { uuid } = ctx.params;
    const mood = await Mood.findOne({ uuid, is_system: 1 });
    if (!mood) {
      ctx.status = 404;
      ctx.body = { success: false, message: '系统心情不存在' };
      return;
    }
    mood.status = 0;
    await mood.save();
    ctx.body = { success: true, message: '系统心情删除成功' };
  } catch (error) {
    console.error('[管理员删除系统心情错误]:', error);
    ctx.status = 500;
    ctx.body = { success: false, message: '删除系统心情失败：' + error.message };
  }
});

/**
 * @swagger
 * /api/admin/moods:
 *   get:
 *     summary: 管理员获取所有系统心情
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 */
adminRouter.get('/moods', auth, role(['admin', 'superadmin']), async (ctx) => {
  try {
    const { keyword, page = 1, page_size = 20 } = ctx.query;
    const query = { is_system: 1 };
    if (keyword) query.name = { $regex: keyword, $options: 'i' };

    const total = await Mood.countDocuments(query);
    const moods = await Mood.find(query)
      .sort({ sort_order: -1, use_count: -1 })
      .skip((page - 1) * page_size)
      .limit(parseInt(page_size));

    ctx.body = { success: true, data: { total, items: moods } };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: '获取系统心情失败：' + error.message };
  }
});

// 注册路由前缀
router.prefix('/api');
adminRouter.prefix('/api/admin');

module.exports = { router, adminRouter };
