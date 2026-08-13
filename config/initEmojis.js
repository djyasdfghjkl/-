const { initDefaultEmojiPacks } = require("../utils/emojiManager");

async function initDefaultEmojis() {
  try {
    console.log("开始初始化默认表情资源...");
    await initDefaultEmojiPacks();
    console.log("默认表情资源初始化完成");
  } catch (error) {
    console.error("初始化默认表情资源失败:", error);
  }
}

module.exports = initDefaultEmojis;
