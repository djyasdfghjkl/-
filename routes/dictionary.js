const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const Dictionary = require("../models/Dictionary");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");

/**
 * @swagger
 * /api/dictionaries: 
 *   get:
 *     summary: 获取所有字典
 *     description: 获取系统中所有字典数据
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 */
router.get("/dictionaries", auth, async (ctx) => {
  try {
    const dictionaries = await Dictionary.find().sort("type");
    ctx.body = {
      success: true,
      data: dictionaries
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "获取字典失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/dictionaries/{type}: 
 *   get:
 *     summary: 获取指定类型字典
 *     description: 根据类型获取字典数据
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 字典不存在
 */
router.get("/dictionaries/:type", async (ctx) => {
  try {
    const { type } = ctx.params;
    const dictionary = await Dictionary.findOne({ type });
    
    if (!dictionary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "字典不存在" };
      return;
    }
    
    ctx.body = {
      success: true,
      data: dictionary
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "获取字典失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/admin/dictionaries: 
 *   post:
 *     summary: 创建字典
 *     description: 创建新的字典
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     description:
 *                       type: string
 *                     sort:
 *                       type: number
 *                     status:
 *                       type: boolean
 *               description:
 *                 type: string
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
adminRouter.post("/dictionaries", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { type, items, description } = ctx.request.body;
    
    if (!type) {
      ctx.status = 400;
      ctx.body = { success: false, message: "缺少字典类型" };
      return;
    }
    
    // 检查字典是否已存在
    const existingDict = await Dictionary.findOne({ type });
    if (existingDict) {
      ctx.status = 409;
      ctx.body = { success: false, message: "字典类型已存在" };
      return;
    }
    
    const dictionary = new Dictionary({
      type,
      items: items || [],
      description
    });
    
    await dictionary.save();
    
    ctx.status = 201;
    ctx.body = {
      success: true,
      message: "字典创建成功",
      data: dictionary
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "创建字典失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/admin/dictionaries/{type}: 
 *   put:
 *     summary: 更新字典
 *     description: 更新指定类型的字典
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     value:
 *                       type: string
 *                     description:
 *                       type: string
 *                     sort:
 *                       type: number
 *                     status:
 *                       type: boolean
 *               description:
 *                 type: string
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
 *         description: 字典不存在
 */
adminRouter.put("/dictionaries/:type", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { type } = ctx.params;
    const { items, description } = ctx.request.body;
    
    const dictionary = await Dictionary.findOne({ type });
    
    if (!dictionary) {
      ctx.status = 404;
      ctx.body = { success: false, message: "字典不存在" };
      return;
    }
    
    if (items !== undefined) dictionary.items = items;
    if (description !== undefined) dictionary.description = description;
    dictionary.updatedAt = Date.now();
    
    await dictionary.save();
    
    ctx.body = {
      success: true,
      message: "字典更新成功",
      data: dictionary
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "更新字典失败：" + error.message };
  }
});

/**
 * @swagger
 * /api/admin/dictionaries/{type}: 
 *   delete:
 *     summary: 删除字典
 *     description: 删除指定类型的字典
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
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
 *         description: 字典不存在
 */
adminRouter.delete("/dictionaries/:type", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { type } = ctx.params;
    
    const result = await Dictionary.deleteOne({ type });
    
    if (result.deletedCount === 0) {
      ctx.status = 404;
      ctx.body = { success: false, message: "字典不存在" };
      return;
    }
    
    ctx.body = {
      success: true,
      message: "字典删除成功"
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "删除字典失败：" + error.message };
  }
});

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter
};