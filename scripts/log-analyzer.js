const fs = require("fs");
const path = require("path");

// 日志目录路径
const LOGS_DIR = path.join(__dirname, "../logs");
// 输出目录路径
const OUTPUT_DIR = path.join(__dirname, "../output");

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 读取日志目录下的文件
function readLogFiles() {
  try {
    const files = fs.readdirSync(LOGS_DIR);
    return files.filter((file) => file.endsWith(".log"));
  } catch (error) {
    console.error("读取日志目录失败:", error.message);
    return [];
  }
}

// 分析日志文件
function analyzeLogFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    const stats = {
      totalRequests: 0,
      uniqueUsers: new Set(),
      pathStats: {},
      methodStats: {},
      statusCodeStats: {},
      responseTime: {
        total: 0,
        count: 0,
        average: 0,
      },
      ipStats: {},
    };

    lines.forEach((line) => {
      try {
        const log = JSON.parse(line);
        stats.totalRequests++;

        // 统计用户
        if (log.user_id) {
          stats.uniqueUsers.add(log.user_id);
        }

        // 统计路径
        const path = log.url.split("?")[0];
        stats.pathStats[path] = (stats.pathStats[path] || 0) + 1;

        // 统计请求方法
        stats.methodStats[log.method] =
          (stats.methodStats[log.method] || 0) + 1;

        // 统计状态码
        stats.statusCodeStats[log.response.status] =
          (stats.statusCodeStats[log.response.status] || 0) + 1;

        // 统计响应时间
        if (log.response_time) {
          stats.responseTime.total += log.response_time;
          stats.responseTime.count++;
        }

        // 统计IP
        stats.ipStats[log.ip] = (stats.ipStats[log.ip] || 0) + 1;
      } catch (error) {
        console.error("解析日志行失败:", error.message);
      }
    });

    // 计算平均响应时间
    if (stats.responseTime.count > 0) {
      stats.responseTime.average =
        stats.responseTime.total / stats.responseTime.count;
    }

    return stats;
  } catch (error) {
    console.error("分析日志文件失败:", error.message);
    return null;
  }
}

// 显示统计结果
function displayStats(fileName, stats) {
  console.log("\n====================================");
  console.log(`日志文件: ${fileName}`);
  console.log("====================================");
  console.log(`总请求数: ${stats.totalRequests}`);
  console.log(`独立用户数: ${stats.uniqueUsers.size}`);

  console.log("\n请求方法统计:");
  Object.entries(stats.methodStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`  ${method}: ${count}次`);
    });

  console.log("\n请求路径统计 (前10):");
  Object.entries(stats.pathStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([path, count]) => {
      console.log(`  ${path}: ${count}次`);
    });

  console.log("\n状态码统计:");
  Object.entries(stats.statusCodeStats)
    .sort((a, b) => a[0] - b[0])
    .forEach(([status, count]) => {
      console.log(`  ${status}: ${count}次`);
    });

  console.log("\n响应时间统计:");
  console.log(`  平均响应时间: ${stats.responseTime.average.toFixed(2)}ms`);

  console.log("\nIP统计 (前10):");
  Object.entries(stats.ipStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([ip, count]) => {
      console.log(`  ${ip}: ${count}次`);
    });
  console.log("====================================\n");
}

// 将统计结果存储为CSV文件
function saveStatsToCSV(fileName, stats) {
  try {
    // 生成文件名
    const csvFileName = `log-analysis-${fileName.replace(".log", "")}.csv`;
    const csvFilePath = path.join(OUTPUT_DIR, csvFileName);

    // 准备CSV内容
    let csvContent = "";

    // 添加基本统计信息
    csvContent += "统计项,数值\n";
    csvContent += `总请求数,${stats.totalRequests}\n`;
    csvContent += `独立用户数,${stats.uniqueUsers.size}\n`;
    csvContent += `平均响应时间,${stats.responseTime.average.toFixed(2)}ms\n\n`;

    // 添加请求方法统计
    csvContent += "请求方法,次数\n";
    Object.entries(stats.methodStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([method, count]) => {
        csvContent += `${method},${count}\n`;
      });
    csvContent += "\n";

    // 添加请求路径统计
    csvContent += "请求路径,次数\n";
    Object.entries(stats.pathStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([path, count]) => {
        csvContent += `${path},${count}\n`;
      });
    csvContent += "\n";

    // 添加状态码统计
    csvContent += "状态码,次数\n";
    Object.entries(stats.statusCodeStats)
      .sort((a, b) => a[0] - b[0])
      .forEach(([status, count]) => {
        csvContent += `${status},${count}\n`;
      });
    csvContent += "\n";

    // 添加IP统计
    csvContent += "IP地址,次数\n";
    Object.entries(stats.ipStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ip, count]) => {
        csvContent += `${ip},${count}\n`;
      });

    // 写入文件
    fs.writeFileSync(csvFilePath, csvContent, "utf8");
    console.log(`统计结果已保存到: ${csvFilePath}`);

    return csvFilePath;
  } catch (error) {
    console.error("保存统计结果失败:", error.message);
    return null;
  }
}

// 主函数
function main() {
  console.log("日志分析工具");
  console.log("=============\n");

  // 读取日志文件列表
  const logFiles = readLogFiles();

  if (logFiles.length === 0) {
    console.log("没有找到日志文件");
    return;
  }

  console.log("可用的日志文件:");
  logFiles.forEach((file, index) => {
    console.log(`${index + 1}. ${file}`);
  });

  // 从命令行获取用户输入
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.question("请选择要分析的文件编号: ", (answer) => {
    const index = parseInt(answer) - 1;

    if (isNaN(index) || index < 0 || index >= logFiles.length) {
      console.log("无效的选择");
      readline.close();
      return;
    }

    const selectedFile = logFiles[index];
    const filePath = path.join(LOGS_DIR, selectedFile);

    console.log(`\n正在分析文件: ${selectedFile}`);

    // 分析日志文件
    const stats = analyzeLogFile(filePath);

    if (stats) {
      displayStats(selectedFile, stats);
      // 保存为CSV文件
      saveStatsToCSV(selectedFile, stats);
    }

    readline.close();
  });
}

// 运行主函数
main();
