const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const { getUserMedals, getAllMedals, awardMedal } = require("../utils/medalManager");
const Medal = require("../models/Medal");

/**
 * @swagger
 * /api/medals/user: 
 *   get:
 *     summary: 获取当前用户的勋章列表
 *     description: 获取当前登录用户已获得的所有勋章
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get("/api/medals/user", auth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const medals = await getUserMedals(userId);
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取用户勋章成功",
      data: medals
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取用户勋章失败：" + error.message
    };
  }
});

/**
 * @swagger
 * /api/medals: 
 *   get:
 *     summary: 获取所有勋章列表
 *     description: 获取系统中所有可获得的勋章
 *     responses:
 *       200:
 *         description: 获取成功
 *       500:
 *         description: 服务器错误
 */
router.get("/api/medals", async (ctx) => {
  try {
    const medals = await getAllMedals();
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取勋章列表成功",
      data: medals
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取勋章列表失败：" + error.message
    };
  }
});

/**
 * @swagger
 * /api/medals/{id}: 
 *   get:
 *     summary: 获取单个勋章详情
 *     description: 根据勋章ID获取勋章详情
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: 勋章ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 勋章不存在
 *       500:
 *         description: 服务器错误
 */
router.get("/api/medals/:id", async (ctx) => {
  try {
    const { id } = ctx.params;
    const medal = await Medal.findById(id);
    
    if (!medal) {
      ctx.status = 404;
      ctx.body = {
        success: false,
        message: "勋章不存在"
      };
      return;
    }
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "获取勋章详情成功",
      data: medal
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "获取勋章详情失败：" + error.message
    };
  }
});

/**
 * @swagger
 * /api/admin/medals/award: 
 *   post:
 *     summary: 管理员手动颁发勋章
 *     description: 管理员为指定用户颁发勋章
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - medalId
 *               - reason
 *             properties:
 *               userId: 
 *                 type: string
 *                 description: 用户ID
 *               medalId: 
 *                 type: string
 *                 description: 勋章ID
 *               reason: 
 *                 type: string
 *                 description: 颁发原因
 *     responses:
 *       200:
 *         description: 颁发成功
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 用户或勋章不存在
 *       500:
 *         description: 服务器错误
 */
adminRouter.post("/medals/award", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { userId, medalId, reason } = ctx.request.body;
    
    if (!userId || !medalId || !reason) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "缺少必要参数"
      };
      return;
    }
    
    const result = await awardMedal(userId, medalId, reason);
    
    if (!result.success) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: result.message
      };
      return;
    }
    
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "勋章颁发成功",
      data: result.userMedal
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "颁发勋章失败：" + error.message
    };
  }
});

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter
};