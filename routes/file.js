const Router = require("koa-router");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const multer = require("koa-multer");
const fs = require("fs");

const router = new Router();
const adminRouter = new Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = file.originalname.split(".").pop();
    const newFilename = `${timestamp}_${randomStr}.${ext}`;
    cb(null, newFilename);
  },
});

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload file
 *     description: Upload any type of file (PDF, image, video, etc.)
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *                 description: File description
 *               type:
 *                 type: string
 *                 description: File type (e.g., carousel, icon, user_image)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: No file uploaded
 */
router.post("/files/upload", auth, upload.single("file"), async (ctx) => {
  try {
    const file = ctx.req.file;
    const description = ctx.req.body.description;
    const type = ctx.req.body.type;

    if (!file) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        message: "No file uploaded",
      };
      return;
    }

    // File uploaded successfully
    const serverUrl = ctx.protocol + '://' + ctx.host;
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: file.filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `/${file.filename}`,
        url: `${serverUrl}/${file.filename}`,
        description: description,
        type: type,
      },
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "File upload failed",
      error: error.message,
    };
  }
});

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get user's uploaded files
 *     description: Retrieve list of files uploaded by the current user
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of files
 *       401:
 *         description: Unauthorized
 */
router.get("/files", auth, async (ctx) => {
  try {
    // In a real application, you would store file metadata in a database
    // and retrieve files associated with the current user
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "Files retrieved successfully",
      data: [],
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      success: false,
      message: "Failed to retrieve files",
      error: error.message,
    };
  }
});

/**
 * @swagger
 * /api/admin/files/list:
 *   get:
 *     summary: Get all uploaded files (admin only)
 *     description: Retrieve list of all files uploaded by all users
 *     tags:
 *       - Admin Files
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all files
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
adminRouter.get(
  "/files/list",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      // In a real application, you would retrieve all files from database
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "All files retrieved successfully",
        data: [],
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        success: false,
        message: "Failed to retrieve files",
        error: error.message,
      };
    }
  },
);

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter,
};
