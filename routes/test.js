const Router = require('koa-router');
const router = new Router();

/**
 * @swagger
 * /api/test:
 *   get:
 *     summary: Test endpoint
 *     description: Returns a success message to verify frontend-backend connection
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 */
router.get('/api/test', async (ctx) => {
  ctx.body = {
    success: true,
    message: '测试成功',
    data: {
      timestamp: new Date().toISOString()
    }
  };
});

module.exports = router;