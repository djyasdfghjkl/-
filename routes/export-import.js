const Router = require("koa-router");
const router = new Router();
const adminRouter = new Router();
const auth = require("../middleware/auth");
const { role } = require("../middleware/role");
const fs = require("fs");
const path = require("path");
const multer = require("koa-multer");
const { parse } = require("json2csv");
const xlsx = require("xlsx");

// 导入数据模型
const User = require("../models/User");
const Dictionary = require("../models/Dictionary");
const Medal = require("../models/Medal");
const RechargeRecord = require("../models/RechargeRecord");
const RedeemCode = require("../models/RedeemCode");
const UserMedal = require("../models/UserMedal");

// 配置multer存储
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

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// 导出数据为CSV
function exportToCSV(data, fields) {
  const csv = parse(data, { fields });
  return csv;
}

// 导出数据为Excel
function exportToExcel(data, sheetName) {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  return xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });
}

// 导出数据为JSON
function exportToJSON(data) {
  return JSON.stringify(data, null, 2);
}

// 导出用户数据
adminRouter.get("/export/users", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { format, limit } = ctx.query;
    const limitNum = limit ? parseInt(limit) : 0;
    
    let query = User.find().select("-password");
    if (limitNum > 0) {
      query = query.limit(limitNum);
    }
    
    const users = await query.exec();
    
    // 准备导出数据
    const exportData = users.map(user => ({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      vipExpireDate: user.vipExpireDate ? user.vipExpireDate.toISOString() : null,
      svipExpireDate: user.svipExpireDate ? user.svipExpireDate.toISOString() : null,
      balance: user.balance,
      totalLoginDays: user.totalLoginDays,
      consecutiveLoginDays: user.consecutiveLoginDays,
      lastLoginDate: user.lastLoginDate ? user.lastLoginDate.toISOString() : null,
      lastLoginIp: user.lastLoginIp,
      loginCount: user.loginCount,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }));
    
    // 根据格式导出
    let content, contentType, filename;
    
    switch (format) {
      case "csv":
        content = exportToCSV(exportData, Object.keys(exportData[0] || {}));
        contentType = "text/csv";
        filename = `users_${Date.now()}.csv`;
        break;
      case "xlsx":
        content = exportToExcel(exportData, "Users");
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `users_${Date.now()}.xlsx`;
        break;
      case "json":
      default:
        content = exportToJSON(exportData);
        contentType = "application/json";
        filename = `users_${Date.now()}.json`;
        break;
    }
    
    // 设置响应头
    ctx.set("Content-Type", contentType);
    ctx.set("Content-Disposition", `attachment; filename=${filename}`);
    
    ctx.body = content;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导出用户数据失败：" + error.message };
  }
});

// 导出字典数据
adminRouter.get("/export/dictionaries", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { format } = ctx.query;
    
    const dictionaries = await Dictionary.find().exec();
    
    // 准备导出数据
    const exportData = dictionaries.map(dict => ({
      type: dict.type,
      description: dict.description,
      items: JSON.stringify(dict.items),
      createdAt: dict.createdAt.toISOString(),
      updatedAt: dict.updatedAt.toISOString()
    }));
    
    // 根据格式导出
    let content, contentType, filename;
    
    switch (format) {
      case "csv":
        content = exportToCSV(exportData, Object.keys(exportData[0] || {}));
        contentType = "text/csv";
        filename = `dictionaries_${Date.now()}.csv`;
        break;
      case "xlsx":
        content = exportToExcel(exportData, "Dictionaries");
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `dictionaries_${Date.now()}.xlsx`;
        break;
      case "json":
      default:
        content = exportToJSON(dictionaries);
        contentType = "application/json";
        filename = `dictionaries_${Date.now()}.json`;
        break;
    }
    
    // 设置响应头
    ctx.set("Content-Type", contentType);
    ctx.set("Content-Disposition", `attachment; filename=${filename}`);
    
    ctx.body = content;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导出字典数据失败：" + error.message };
  }
});

// 导出勋章数据
adminRouter.get("/export/medals", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { format } = ctx.query;
    
    const medals = await Medal.find().exec();
    
    // 准备导出数据
    const exportData = medals.map(medal => ({
      id: medal._id,
      name: medal.name,
      description: medal.description,
      icon: medal.icon,
      condition: JSON.stringify(medal.condition),
      createdAt: medal.createdAt.toISOString(),
      updatedAt: medal.updatedAt.toISOString()
    }));
    
    // 根据格式导出
    let content, contentType, filename;
    
    switch (format) {
      case "csv":
        content = exportToCSV(exportData, Object.keys(exportData[0] || {}));
        contentType = "text/csv";
        filename = `medals_${Date.now()}.csv`;
        break;
      case "xlsx":
        content = exportToExcel(exportData, "Medals");
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `medals_${Date.now()}.xlsx`;
        break;
      case "json":
      default:
        content = exportToJSON(medals);
        contentType = "application/json";
        filename = `medals_${Date.now()}.json`;
        break;
    }
    
    // 设置响应头
    ctx.set("Content-Type", contentType);
    ctx.set("Content-Disposition", `attachment; filename=${filename}`);
    
    ctx.body = content;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导出勋章数据失败：" + error.message };
  }
});

// 导出充值记录
adminRouter.get("/export/recharge-records", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { format, limit } = ctx.query;
    const limitNum = limit ? parseInt(limit) : 0;
    
    let query = RechargeRecord.find().populate("userId", "username email");
    if (limitNum > 0) {
      query = query.limit(limitNum);
    }
    
    const records = await query.exec();
    
    // 准备导出数据
    const exportData = records.map(record => ({
      id: record._id,
      userId: record.userId ? record.userId._id : null,
      username: record.userId ? record.userId.username : null,
      userEmail: record.userId ? record.userId.email : null,
      amount: record.amount,
      type: record.type,
      duration: record.duration,
      expireDate: record.expireDate ? record.expireDate.toISOString() : null,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString()
    }));
    
    // 根据格式导出
    let content, contentType, filename;
    
    switch (format) {
      case "csv":
        content = exportToCSV(exportData, Object.keys(exportData[0] || {}));
        contentType = "text/csv";
        filename = `recharge_records_${Date.now()}.csv`;
        break;
      case "xlsx":
        content = exportToExcel(exportData, "RechargeRecords");
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `recharge_records_${Date.now()}.xlsx`;
        break;
      case "json":
      default:
        content = exportToJSON(records);
        contentType = "application/json";
        filename = `recharge_records_${Date.now()}.json`;
        break;
    }
    
    // 设置响应头
    ctx.set("Content-Type", contentType);
    ctx.set("Content-Disposition", `attachment; filename=${filename}`);
    
    ctx.body = content;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导出充值记录失败：" + error.message };
  }
});

// 导出兑换码
adminRouter.get("/export/redeem-codes", auth, role(["admin", "superadmin"]), async (ctx) => {
  try {
    const { format, limit } = ctx.query;
    const limitNum = limit ? parseInt(limit) : 0;
    
    let query = RedeemCode.find().populate("usedBy", "username email");
    if (limitNum > 0) {
      query = query.limit(limitNum);
    }
    
    const codes = await query.exec();
    
    // 准备导出数据
    const exportData = codes.map(code => ({
      id: code._id,
      code: code.code,
      type: code.type,
      value: code.value,
      expiresAt: code.expiresAt.toISOString(),
      isUsed: code.isUsed,
      usedBy: code.usedBy ? code.usedBy._id : null,
      usedUsername: code.usedBy ? code.usedBy.username : null,
      usedEmail: code.usedBy ? code.usedBy.email : null,
      usedAt: code.usedAt ? code.usedAt.toISOString() : null,
      createdAt: code.createdAt.toISOString(),
      updatedAt: code.updatedAt.toISOString()
    }));
    
    // 根据格式导出
    let content, contentType, filename;
    
    switch (format) {
      case "csv":
        content = exportToCSV(exportData, Object.keys(exportData[0] || {}));
        contentType = "text/csv";
        filename = `redeem_codes_${Date.now()}.csv`;
        break;
      case "xlsx":
        content = exportToExcel(exportData, "RedeemCodes");
        contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        filename = `redeem_codes_${Date.now()}.xlsx`;
        break;
      case "json":
      default:
        content = exportToJSON(codes);
        contentType = "application/json";
        filename = `redeem_codes_${Date.now()}.json`;
        break;
    }
    
    // 设置响应头
    ctx.set("Content-Type", contentType);
    ctx.set("Content-Disposition", `attachment; filename=${filename}`);
    
    ctx.body = content;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导出兑换码失败：" + error.message };
  }
});

// 导入用户数据
adminRouter.post("/import/users", auth, role(["admin", "superadmin"]), upload.single("file"), async (ctx) => {
  try {
    const file = ctx.req.file;
    if (!file) {
      ctx.status = 400;
      ctx.body = { success: false, message: "请上传文件" };
      return;
    }
    
    const filePath = path.join("./uploads", file.filename);
    let usersData;
    
    // 根据文件扩展名判断格式
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext === ".json") {
      // 读取JSON文件
      const jsonContent = fs.readFileSync(filePath, "utf8");
      usersData = JSON.parse(jsonContent);
    } else if (ext === ".csv") {
      // 读取CSV文件
      const csv = require("csv-parser");
      usersData = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => usersData.push(data))
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      // 读取Excel文件
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      usersData = xlsx.utils.sheet_to_json(worksheet);
    } else {
      ctx.status = 400;
      ctx.body = { success: false, message: "不支持的文件格式" };
      return;
    }
    
    // 处理导入数据
    let successCount = 0;
    let errorCount = 0;
    
    for (const userData of usersData) {
      try {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          // 更新现有用户
          Object.assign(existingUser, userData);
          await existingUser.save();
        } else {
          // 创建新用户
          const user = new User(userData);
          await user.save();
        }
        successCount++;
      } catch (error) {
        console.error("导入用户失败:", error);
        errorCount++;
      }
    }
    
    // 清理临时文件
    fs.unlinkSync(filePath);
    
    ctx.body = {
      success: true,
      message: `导入完成，成功 ${successCount} 条，失败 ${errorCount} 条`
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导入用户数据失败：" + error.message };
  }
});

// 导入字典数据
adminRouter.post("/import/dictionaries", auth, role(["admin", "superadmin"]), upload.single("file"), async (ctx) => {
  try {
    const file = ctx.req.file;
    if (!file) {
      ctx.status = 400;
      ctx.body = { success: false, message: "请上传文件" };
      return;
    }
    
    const filePath = path.join("./uploads", file.filename);
    let dictionariesData;
    
    // 根据文件扩展名判断格式
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext === ".json") {
      // 读取JSON文件
      const jsonContent = fs.readFileSync(filePath, "utf8");
      dictionariesData = JSON.parse(jsonContent);
    } else if (ext === ".csv") {
      // 读取CSV文件
      const csv = require("csv-parser");
      dictionariesData = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            // 解析items字段
            if (data.items) {
              try {
                data.items = JSON.parse(data.items);
              } catch (e) {
                data.items = [];
              }
            }
            dictionariesData.push(data);
          })
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      // 读取Excel文件
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      dictionariesData = xlsx.utils.sheet_to_json(worksheet);
      // 解析items字段
      dictionariesData.forEach(item => {
        if (item.items) {
          try {
            item.items = JSON.parse(item.items);
          } catch (e) {
            item.items = [];
          }
        }
      });
    } else {
      ctx.status = 400;
      ctx.body = { success: false, message: "不支持的文件格式" };
      return;
    }
    
    // 处理导入数据
    let successCount = 0;
    let errorCount = 0;
    
    for (const dictData of dictionariesData) {
      try {
        // 检查字典是否已存在
        const existingDict = await Dictionary.findOne({ type: dictData.type });
        if (existingDict) {
          // 更新现有字典
          Object.assign(existingDict, dictData);
          await existingDict.save();
        } else {
          // 创建新字典
          const dict = new Dictionary(dictData);
          await dict.save();
        }
        successCount++;
      } catch (error) {
        console.error("导入字典失败:", error);
        errorCount++;
      }
    }
    
    // 清理临时文件
    fs.unlinkSync(filePath);
    
    ctx.body = {
      success: true,
      message: `导入完成，成功 ${successCount} 条，失败 ${errorCount} 条`
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导入字典数据失败：" + error.message };
  }
});

// 导入勋章数据
adminRouter.post("/import/medals", auth, role(["admin", "superadmin"]), upload.single("file"), async (ctx) => {
  try {
    const file = ctx.req.file;
    if (!file) {
      ctx.status = 400;
      ctx.body = { success: false, message: "请上传文件" };
      return;
    }
    
    const filePath = path.join("./uploads", file.filename);
    let medalsData;
    
    // 根据文件扩展名判断格式
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (ext === ".json") {
      // 读取JSON文件
      const jsonContent = fs.readFileSync(filePath, "utf8");
      medalsData = JSON.parse(jsonContent);
    } else if (ext === ".csv") {
      // 读取CSV文件
      const csv = require("csv-parser");
      medalsData = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            // 解析condition字段
            if (data.condition) {
              try {
                data.condition = JSON.parse(data.condition);
              } catch (e) {
                data.condition = {};
              }
            }
            medalsData.push(data);
          })
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (ext === ".xlsx" || ext === ".xls") {
      // 读取Excel文件
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      medalsData = xlsx.utils.sheet_to_json(worksheet);
      // 解析condition字段
      medalsData.forEach(item => {
        if (item.condition) {
          try {
            item.condition = JSON.parse(item.condition);
          } catch (e) {
            item.condition = {};
          }
        }
      });
    } else {
      ctx.status = 400;
      ctx.body = { success: false, message: "不支持的文件格式" };
      return;
    }
    
    // 处理导入数据
    let successCount = 0;
    let errorCount = 0;
    
    for (const medalData of medalsData) {
      try {
        // 检查勋章是否已存在
        const existingMedal = await Medal.findOne({ name: medalData.name });
        if (existingMedal) {
          // 更新现有勋章
          Object.assign(existingMedal, medalData);
          await existingMedal.save();
        } else {
          // 创建新勋章
          const medal = new Medal(medalData);
          await medal.save();
        }
        successCount++;
      } catch (error) {
        console.error("导入勋章失败:", error);
        errorCount++;
      }
    }
    
    // 清理临时文件
    fs.unlinkSync(filePath);
    
    ctx.body = {
      success: true,
      message: `导入完成，成功 ${successCount} 条，失败 ${errorCount} 条`
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: "导入勋章数据失败：" + error.message };
  }
});

// 注册路由前缀
router.prefix("/api");
adminRouter.prefix("/api/admin");

module.exports = {
  router,
  adminRouter
};
