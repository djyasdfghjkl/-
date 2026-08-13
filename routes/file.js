const Router = require("koa-router");
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const multer = require("koa-multer");
const fs = require("fs");
const path = require("path");
const FileAsset = require("../models/FileAsset");

const router = new Router();
const adminRouter = new Router();

const resolveServerUrl = (ctx) => {
  const host = ctx.host || "";
  const localHosts = ["localhost", "127.0.0.1", "::1"];
  if (localHosts.some((item) => host.includes(item))) {
    return `http://${host}`;
  }

  const forwardedProto = ctx.get("x-forwarded-proto");
  if (forwardedProto) {
    return `${forwardedProto.split(",")[0].trim()}://${ctx.host}`;
  }

  const candidates = [ctx.get("origin"), ctx.get("referer")].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate);
      return `${parsed.protocol}//${ctx.host}`;
    } catch (error) {
      console.warn("Failed to parse request URL candidate:", candidate);
    }
  }

  return `${ctx.protocol || "http"}://${ctx.host}`;
};

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

    const serverUrl = resolveServerUrl(ctx);
    const asset = await FileAsset.create({
      filename: file.filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: `/${file.filename}`,
      url: `${serverUrl}/${file.filename}`,
      description: description || "",
      type: type || "general",
      userId: ctx.state.user?._id || ctx.state.user?.id || null,
    });

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
        id: asset.id,
        createdAt: asset.createdAt,
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
    const userId = ctx.state.user?._id || ctx.state.user?.id;
    const files = await FileAsset.find({ userId }).sort({ createdAt: -1 });
    ctx.status = 200;
    ctx.body = {
      success: true,
      message: "Files retrieved successfully",
      data: files,
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
      const files = await FileAsset.find()
        .populate("userId", "username nickname email")
        .sort({ createdAt: -1 });
      ctx.status = 200;
      ctx.body = {
        success: true,
        message: "All files retrieved successfully",
        data: files,
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

adminRouter.delete(
  "/files/:id",
  auth,
  role(["admin", "superadmin"]),
  async (ctx) => {
    try {
      const asset = await FileAsset.findById(ctx.params.id);
      if (!asset) {
        ctx.status = 404;
        ctx.body = { success: false, message: "File not found" };
        return;
      }

      const uploadRoot = path.resolve("./uploads");
      const targetPath = path.resolve(uploadRoot, asset.filename);
      if (targetPath.startsWith(uploadRoot) && fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
      }
      await asset.deleteOne();
      ctx.body = { success: true, message: "File deleted successfully" };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, message: "Failed to delete file", error: error.message };
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
