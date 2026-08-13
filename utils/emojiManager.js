const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Emoji = require("../models/Emoji");
const EmojiCategory = require("../models/EmojiCategory");

const STATIC_ROOT = path.resolve(__dirname, "..", "..", "note_view", "static");

const RESOURCE_TYPE_TO_LEGACY = {
  emoji: 1,
  image: 2,
  lottie: 3,
};

const DEFAULT_CATEGORIES = [
  { code: "mood-picks", name: "心情精选", description: "写日记时用于选择心情的动画与表情。", icon: "😊", scene: "mood", sort_order: 1 },
  { code: "editor-pack", name: "写作表情包", description: "编辑日记时可直接插入的表情内容。", icon: "✨", scene: "editor", sort_order: 2 },
];

const DEFAULT_EMOJIS = [
  { uuid: "emoji-happy-bloom", name: "开心", description: "明亮、松弛、适合记录今天的小高光。", resource_type: "emoji", resource_value: "😊", preview_text: "😊", tags: ["开心", "轻松", "日常"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 120, source: "default" },
  { uuid: "emoji-sunshine-smile", name: "晴朗", description: "适合平静且有能量的一天。", resource_type: "emoji", resource_value: "🌞", preview_text: "🌞", tags: ["治愈", "元气", "平静"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 110, source: "default" },
  { uuid: "emoji-calm-moon", name: "平静", description: "慢下来以后，心里刚刚好的状态。", resource_type: "emoji", resource_value: "🌙", preview_text: "🌙", tags: ["平静", "夜晚", "安稳"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 100, source: "default" },
  { uuid: "emoji-curious-wow", name: "惊喜", description: "适合记录突然发生的小惊喜。", resource_type: "emoji", resource_value: "🤩", preview_text: "🤩", tags: ["惊喜", "高光", "激动"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 95, source: "default" },
  { uuid: "emoji-thinking-soft", name: "想想", description: "脑子里有很多话，但想慢一点写下来。", resource_type: "emoji", resource_value: "🤔", preview_text: "🤔", tags: ["思考", "记录", "慢下来"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 90, source: "default" },
  { uuid: "emoji-home-wave", name: "归心", description: "把情绪慢慢收回到自己身边。", resource_type: "lottie", resource_value: "/static/icon/home.json", preview_text: "😌", tags: ["平静", "居家", "温柔"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 85, source: "default", width: 96, height: 96 },
  { uuid: "emoji-message-glow", name: "灵感", description: "突然冒出来一句很想记住的话。", resource_type: "lottie", resource_value: "/static/icon/message.json", preview_text: "✨", tags: ["灵感", "想法", "表达"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 80, source: "default", width: 96, height: 96 },
  { uuid: "emoji-personal-spark", name: "心动", description: "今天有一点点被戳中心。", resource_type: "lottie", resource_value: "/static/icon/personal.json", preview_text: "🥰", tags: ["喜欢", "甜", "心动"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 75, source: "default", width: 96, height: 96 },
  { uuid: "emoji-app-pulse", name: "专注", description: "一段沉浸、推进很顺的时间。", resource_type: "lottie", resource_value: "/static/icon/app.json", preview_text: "😎", tags: ["专注", "推进", "效率"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 70, source: "default", width: 96, height: 96 },
  { uuid: "emoji-morphing-mood", name: "变化中", description: "情绪在流动，今天的心情并不只有一种。", resource_type: "lottie", resource_value: "/static/icon/mood-morphing.json", preview_text: "🫠", tags: ["变化", "复杂", "过渡"], scenes: ["mood", "editor"], categoryCode: "mood-picks", sort_order: 65, source: "lottiefiles", width: 96, height: 96 },
  { uuid: "editor-rainbow-note", name: "彩虹", description: "给一段文字加一点颜色。", resource_type: "emoji", resource_value: "🌈", preview_text: "🌈", tags: ["彩虹", "亮色", "装饰"], scenes: ["editor"], categoryCode: "editor-pack", sort_order: 60, source: "default" },
  { uuid: "editor-clover-luck", name: "好运", description: "适合写下今天的小幸运。", resource_type: "emoji", resource_value: "🍀", preview_text: "🍀", tags: ["好运", "幸运", "记录"], scenes: ["editor"], categoryCode: "editor-pack", sort_order: 55, source: "default" },
  { uuid: "editor-sparkles", name: "闪闪", description: "一句话值得被重点标记。", resource_type: "emoji", resource_value: "✨", preview_text: "✨", tags: ["高亮", "闪光", "可爱"], scenes: ["editor"], categoryCode: "editor-pack", sort_order: 50, source: "default" },
];

function resolveStaticFile(resourceValue = "") {
  if (typeof resourceValue !== "string" || !resourceValue.startsWith("/static/")) {
    return "";
  }
  return path.resolve(STATIC_ROOT, `.${resourceValue.replace("/static", "")}`);
}

function isRenderableResource(resourceType, resourceValue) {
  if (!resourceValue) return false;
  if (resourceType === "emoji") return true;
  if (/^https?:\/\//i.test(resourceValue)) return true;
  if (resourceValue.startsWith("/")) {
    const target = resolveStaticFile(resourceValue);
    return target ? fs.existsSync(target) : false;
  }
  return false;
}

function normalizeResourceType(value, legacyType) {
  if (value && RESOURCE_TYPE_TO_LEGACY[value]) return value;
  if (Number(legacyType) === 3) return "lottie";
  if (Number(legacyType) === 2) return "image";
  return "emoji";
}

function normalizeEmojiDoc(emojiDoc) {
  const category = emojiDoc.category_id && typeof emojiDoc.category_id === "object" ? emojiDoc.category_id : null;
  const resourceType = normalizeResourceType(emojiDoc.resource_type, emojiDoc.type);
  const resourceValue = String(emojiDoc.resource_value || emojiDoc.url || emojiDoc.thumbnail_url || emojiDoc.preview_text || "").trim();
  const previewText = String(emojiDoc.preview_text || (resourceType === "emoji" ? resourceValue : "") || emojiDoc.name?.slice?.(0, 2) || "").trim();
  const thumbnailUrl = String(emojiDoc.thumbnail_url || "").trim();
  const previewUrl = resourceType === "emoji" ? "" : resourceValue;
  const scenes = Array.isArray(emojiDoc.scenes) ? emojiDoc.scenes.filter(Boolean) : [];

  return {
    id: emojiDoc.uuid,
    _id: emojiDoc._id,
    name: emojiDoc.name,
    description: emojiDoc.description || "",
    categoryId: category?._id || emojiDoc.category_id || null,
    categoryCode: category?.code || "",
    categoryName: category?.name || "",
    resourceType,
    resourceValue,
    previewText,
    previewUrl,
    thumbnailUrl,
    useCount: Number(emojiDoc.use_count || 0),
    sortOrder: Number(emojiDoc.sort_order || 0),
    tags: Array.isArray(emojiDoc.tags) ? emojiDoc.tags : [],
    scenes,
    source: emojiDoc.source || "manual",
    enabled: emojiDoc.status !== 0,
    isOfficial: emojiDoc.is_official !== false,
    width: Number(emojiDoc.width || 0),
    height: Number(emojiDoc.height || 0),
    duration: Number(emojiDoc.duration || 0),
    isRenderable: isRenderableResource(resourceType, previewUrl || resourceValue),
  };
}

async function initDefaultEmojiPacks() {
  const categories = {};
  for (const categoryDef of DEFAULT_CATEGORIES) {
    const category = await EmojiCategory.findOneAndUpdate(
      { code: categoryDef.code },
      {
        $set: {
          name: categoryDef.name,
          description: categoryDef.description,
          icon: categoryDef.icon,
          scene: categoryDef.scene,
          sort_order: categoryDef.sort_order,
          is_active: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categories[categoryDef.code] = category;
  }

  for (const emojiDef of DEFAULT_EMOJIS) {
    const category = categories[emojiDef.categoryCode];
    const resourceType = emojiDef.resource_type;
    const resourceValue = emojiDef.resource_value;
    await Emoji.findOneAndUpdate(
      { uuid: emojiDef.uuid },
      {
        $set: {
          name: emojiDef.name,
          description: emojiDef.description,
          type: RESOURCE_TYPE_TO_LEGACY[resourceType] || 1,
          resource_type: resourceType,
          resource_value: resourceValue,
          url: resourceValue,
          thumbnail_url: emojiDef.thumbnail_url || "",
          preview_text: emojiDef.preview_text || "",
          tags: emojiDef.tags || [],
          scenes: emojiDef.scenes || [],
          category_id: category?._id || null,
          is_official: true,
          status: 1,
          sort_order: emojiDef.sort_order || 0,
          source: emojiDef.source || "default",
          width: emojiDef.width || 0,
          height: emojiDef.height || 0,
          duration: emojiDef.duration || 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
}

function sanitizeEmojiPayload(payload = {}) {
  const resourceType = normalizeResourceType(payload.resourceType || payload.resource_type, payload.type);
  const scenes = Array.isArray(payload.scenes)
    ? payload.scenes
    : String(payload.scenes || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const resourceValue = String(payload.resourceValue || payload.resource_value || payload.url || payload.previewUrl || payload.lottieUrl || payload.iconUrl || "").trim();
  return {
    uuid: payload.uuid || uuidv4(),
    name: String(payload.name || "").trim(),
    description: String(payload.description || "").trim(),
    resource_type: resourceType,
    resource_value: resourceValue,
    type: RESOURCE_TYPE_TO_LEGACY[resourceType] || 1,
    url: resourceValue,
    thumbnail_url: String(payload.thumbnailUrl || payload.thumbnail_url || "").trim(),
    preview_text: String(payload.previewText || payload.preview_text || "").trim(),
    tags: Array.isArray(payload.tags)
      ? payload.tags.filter(Boolean)
      : String(payload.tags || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    scenes,
    sort_order: Number(payload.sortOrder ?? payload.sort_order ?? 0),
    width: Number(payload.width || 0),
    height: Number(payload.height || 0),
    duration: Number(payload.duration || 0),
    is_official: payload.isOfficial !== false,
    status: payload.enabled === false || Number(payload.status) === 0 ? 0 : 1,
    source: String(payload.source || "manual").trim() || "manual",
    categoryCode: String(payload.categoryCode || "").trim(),
    categoryId: payload.categoryId || payload.category_id || null,
  };
}

module.exports = {
  DEFAULT_CATEGORIES,
  DEFAULT_EMOJIS,
  RESOURCE_TYPE_TO_LEGACY,
  initDefaultEmojiPacks,
  normalizeEmojiDoc,
  sanitizeEmojiPayload,
  isRenderableResource,
};
