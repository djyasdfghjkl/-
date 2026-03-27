const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("📦 开始打包项目...");

const pkg = require("../package.json");
const version = pkg.version;
const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const archiveName = `note-backend-v${version}-${timestamp}`;
const distDir = path.join(__dirname, "..", "dist");

// 创建dist目录
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 需要包含的文件和目录
const includeItems = [
  "index.js",
  "package.json",
  "package-lock.json",
  "ecosystem.config.js",
  "nginx.conf",
  ".env.example",
  "config/",
  "middleware/",
  "models/",
  "routes/",
  "scripts/",
  "utils/",
  "文档/",
];

// 需要排除的文件和目录
const excludeItems = [
  "node_modules/",
  ".git/",
  ".gitignore",
  "dist/",
  "uploads/",
  "logs/",
  "output/",
  "*.md",
  "!文档/",
  ".env",
  ".DS_Store",
  "Thumbs.db",
  "*.log",
  "*.swp",
  "*.swo",
  "*~",
];

console.log(`📋 版本: v${version}`);
console.log(`🕐 时间: ${timestamp}`);
console.log(`📁 输出目录: ${distDir}`);

try {
  // 检查是否有tar命令（Linux/Mac）
  let useTar = false;
  try {
    execSync("tar --version", { stdio: "ignore" });
    useTar = true;
  } catch (e) {
    console.log("ℹ️  未检测到tar命令，将使用Node.js原生方式打包");
  }

  const archivePath = path.join(distDir, `${archiveName}.tar.gz`);

  if (useTar) {
    // 使用tar命令打包（推荐，更快更可靠）
    console.log("🔧 使用tar命令打包...");

    // 构建tar命令
    let tarCmd = "tar -czf";
    tarCmd += ` "${archivePath}"`;

    // 添加排除项
    excludeItems.forEach((item) => {
      tarCmd += ` --exclude="${item}"`;
    });

    // 添加包含项
    includeItems.forEach((item) => {
      tarCmd += ` "${item}"`;
    });

    // 在项目根目录执行
    execSync(tarCmd, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
  } else {
    // 使用Node.js原生方式打包（Windows兼容）
    console.log("🔧 使用Node.js原生方式打包...");
    console.log("⚠️  注意：Windows下建议使用Git Bash或WSL以获得更好的打包体验");

    // 简单的复制方式（Windows备用方案）
    const tempDir = path.join(distDir, archiveName);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // 复制文件
    includeItems.forEach((item) => {
      const srcPath = path.join(__dirname, "..", item);
      const destPath = path.join(tempDir, item);

      if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
      }
    });

    console.log(`✅ 已创建临时目录: ${tempDir}`);
    console.log(`📝 请手动压缩该目录为zip或tar.gz格式`);
    console.log(`📂 临时目录位置: ${tempDir}`);
  }

  if (useTar) {
    const stats = fs.statSync(archivePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("\n✨ 打包完成！");
    console.log(`📦 包名: ${archiveName}.tar.gz`);
    console.log(`📊 大小: ${sizeMB} MB`);
    console.log(`📍 位置: ${archivePath}`);
    console.log("\n🚀 上传到服务器后执行:");
    console.log(`   tar -xzf ${archiveName}.tar.gz`);
    console.log(`   cd ${archiveName}`);
    console.log(`   npm install --production`);
    console.log(`   pm2 start ecosystem.config.js`);
  }
} catch (error) {
  console.error("\n❌ 打包失败:", error.message);
  console.error(error.stack);
  process.exit(1);
}

// 递归复制函数（Windows备用）
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
