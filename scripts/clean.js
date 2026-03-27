const fs = require("fs");
const path = require("path");

console.log("🧹 开始清理项目...");

const itemsToClean = [
  "dist",
  "build",
  ".next",
  "node_modules/.cache",
  "npm-debug.log*",
  "yarn-debug.log*",
  "yarn-error.log*",
  "*.log",
  ".DS_Store",
  "Thumbs.db",
];

const logDirs = ["logs", "output"];

// 清理指定的文件和目录
itemsToClean.forEach((item) => {
  const itemPath = path.join(__dirname, "..", item);
  if (fs.existsSync(itemPath)) {
    try {
      if (fs.statSync(itemPath).isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        console.log(`✅ 已删除目录: ${item}`);
      } else {
        fs.unlinkSync(itemPath);
        console.log(`✅ 已删除文件: ${item}`);
      }
    } catch (error) {
      console.warn(`⚠️  删除失败: ${item}`, error.message);
    }
  }
});

// 清理日志目录中的文件（保留目录结构）
logDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, "..", dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      try {
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          console.log(`✅ 已删除日志: ${dir}/${file}`);
        }
      } catch (error) {
        console.warn(`⚠️  删除日志失败: ${dir}/${file}`, error.message);
      }
    });
  }
});

console.log("✨ 清理完成！");
