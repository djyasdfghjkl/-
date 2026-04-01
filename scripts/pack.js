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
  // Windows 下直接使用 Node.js + PowerShell zip 方案
  const isWindows = process.platform === "win32";

  if (!isWindows) {
    // Linux/Mac 使用 tar
    const archivePath = path.join(distDir, `${archiveName}.tar.gz`);
    console.log("🔧 使用tar命令打包...");

    let tarCmd = "tar -czf";
    tarCmd += ` "${archivePath}"`;

    excludeItems.forEach((item) => {
      tarCmd += ` --exclude="${item}"`;
    });

    includeItems.forEach((item) => {
      tarCmd += ` "${item}"`;
    });

    execSync(tarCmd, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });

    const stats = fs.statSync(archivePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log("\n✨ 打包完成！");
    console.log(`📦 包名: ${archiveName}.tar.gz`);
    console.log(`📊 大小: ${sizeMB} MB`);
    console.log(`📍 位置: ${archivePath}`);
    console.log("\n🚀 上传到服务器后执行:");
    console.log(`   tar -xzf ${archiveName}.tar.gz`);
    console.log(`   npm install --production`);
    console.log(`   pm2 start ecosystem.config.js`);
  } else {
    // 使用Node.js原生方式打包（Windows兼容，生成zip）
    console.log("🔧 使用Node.js原生方式打包...");

    const tempDir = path.join(distDir, archiveName);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // 复制文件
    includeItems.forEach((item) => {
      const srcPath = path.join(__dirname, "..", item);
      const destPath = path.join(tempDir, item);

      if (fs.existsSync(srcPath)) {
        copyRecursiveSync(srcPath, destPath);
      }
    });

    // 使用 PowerShell 压缩为 zip
    const zipPath = path.join(distDir, `${archiveName}.zip`);
    try {
      execSync(
        `powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${zipPath}' -Force"`,
        { stdio: "inherit" }
      );
      // 清理临时目录
      fs.rmSync(tempDir, { recursive: true, force: true });

      const stats = fs.statSync(zipPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log("\n✨ 打包完成！");
      console.log(`📦 包名: ${archiveName}.zip`);
      console.log(`📊 大小: ${sizeMB} MB`);
      console.log(`📍 位置: ${zipPath}`);
    } catch (zipErr) {
      console.log(`✅ 已创建临时目录: ${tempDir}`);
      console.log(`📝 PowerShell压缩失败，请手动压缩该目录`);
    }
  }

  console.log("\n🚀 宝塔部署步骤:");
  console.log("   1. 上传 zip 到服务器，解压到网站目录");
  console.log("   2. 复制 .env.example 为 .env，修改配置");
  console.log("   3. npm install --production");
  console.log("   4. pm2 start ecosystem.config.js --env production");
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
