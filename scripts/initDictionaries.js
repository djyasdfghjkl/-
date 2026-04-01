/**
 * 初始化系统字典数据
 * 运行方式：node scripts/initDictionaries.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Dictionary = require("../models/Dictionary");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/note";

const dictionaries = [
  {
    type: "user_role",
    description: "用户角色，对应 User.role 字段的数值含义",
    items: [
      { key: "0", value: "普通用户", description: "默认角色，无特殊权限", sort: 0, status: true },
      { key: "1", value: "VIP",     description: "VIP会员，vipExpireDate 到期后自动降为普通用户", sort: 1, status: true },
      { key: "2", value: "SVIP",    description: "SVIP会员，svipExpireDate 到期后自动降级", sort: 2, status: true },
      { key: "3", value: "管理员",  description: "后台管理员，可管理内容和用户，不受VIP到期影响", sort: 3, status: true },
      { key: "4", value: "超级管理员", description: "最高权限，可管理管理员账号，不受任何限制", sort: 4, status: true },
    ],
  },
  {
    type: "redeem_code_type",
    description: "兑换码类型，对应生成兑换码时 type 字段的可选值",
    items: [
      { key: "vip",            value: "VIP会员",   description: "value=天数。stackable=true时在现有到期时间上叠加，false时从当前时间重新计算", sort: 1, status: true },
      { key: "svip",           value: "SVIP会员",  description: "value=天数。逻辑同vip，SVIP到期后若有VIP则降为VIP，否则降为普通用户", sort: 2, status: true },
      { key: "balance",        value: "余额",      description: "value=金额（元），直接累加到用户余额", sort: 3, status: true },
      { key: "points",         value: "积分",      description: "value=积分数量，直接累加到用户积分", sort: 4, status: true },
      { key: "level",          value: "等级",      description: "value=目标等级，只会提升不会降低（取 max）", sort: 5, status: true },
      { key: "transfer_percent", value: "转账比例", description: "value=百分比数值（0-200），直接覆盖用户的 transfer_percent 字段", sort: 6, status: true },
      { key: "special_medal",  value: "特殊勋章",  description: "需额外传 medalId，将勋章ID加入用户 special_medals 数组", sort: 7, status: true },
    ],
  },
  {
    type: "user_status",
    description: "用户账号状态，对应 User.status 字段",
    items: [
      { key: "0", value: "禁用", description: "账号被禁用，无法登录", sort: 0, status: true },
      { key: "1", value: "正常", description: "正常使用", sort: 1, status: true },
      { key: "2", value: "冻结", description: "账号被冻结，可登录但功能受限", sort: 2, status: true },
    ],
  },
  {
    type: "diary_weather",
    description: "日记天气选项",
    items: [
      { key: "sunny",   value: "晴天",  sort: 1, status: true },
      { key: "cloudy",  value: "多云",  sort: 2, status: true },
      { key: "overcast",value: "阴天",  sort: 3, status: true },
      { key: "rainy",   value: "雨天",  sort: 4, status: true },
      { key: "snowy",   value: "雪天",  sort: 5, status: true },
      { key: "windy",   value: "大风",  sort: 6, status: true },
      { key: "foggy",   value: "雾霾",  sort: 7, status: true },
      { key: "hot",     value: "炎热",  sort: 8, status: true },
      { key: "cold",    value: "寒冷",  sort: 9, status: true },
    ],
  },
  {
    type: "ad_type",
    description: "广告类型，对应广告点击记录的 ad_type 字段",
    items: [
      { key: "banner",       value: "横幅广告",   sort: 1, status: true },
      { key: "video",        value: "激励视频",   sort: 2, status: true },
      { key: "interstitial", value: "插屏广告",   sort: 3, status: true },
      { key: "native",       value: "原生广告",   sort: 4, status: true },
    ],
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB 已连接");

  let created = 0, skipped = 0;

  for (const dict of dictionaries) {
    const exists = await Dictionary.findOne({ type: dict.type });
    if (exists) {
      console.log(`⏭  跳过（已存在）: ${dict.type}`);
      skipped++;
    } else {
      await Dictionary.create(dict);
      console.log(`✅ 创建成功: ${dict.type}`);
      created++;
    }
  }

  console.log(`\n完成：新建 ${created} 个，跳过 ${skipped} 个`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("初始化失败:", err);
  process.exit(1);
});
