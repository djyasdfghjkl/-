const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Medal = require("../models/Medal");
const User = require("../models/User");
const UserMedal = require("../models/UserMedal");
const { checkLoginStreak, checkTotalLoginDays } = require("./loginStats");

const APP_STATIC_ROOT = path.resolve(__dirname, "..", "..", "note_view", "static");
const UPLOAD_ROOT = path.resolve(__dirname, "..", "uploads");

const DEFAULT_VISUAL = {
  iconPath: "/static/logo.png",
  animPath: "/static/icon/home.json",
};

const MEDAL_PRESETS = [
  {
    name: "初出茅庐",
    description: "完成首次登录",
    type: "login",
    level: 1,
    sort: 1,
    icon: "🌟",
    condition: { type: "first_login" },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/home.json",
  },
  {
    name: "连续登录7天",
    description: "连续登录 7 天，开始把记录变成习惯。",
    type: "login",
    level: 2,
    sort: 2,
    icon: "🔥",
    condition: { type: "consecutive_days", days: 7 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/message.json",
  },
  {
    name: "连续登录30天",
    description: "连续登录 30 天，坚持已经开始发光。",
    type: "login",
    level: 3,
    sort: 3,
    icon: "🏅",
    condition: { type: "consecutive_days", days: 30 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/personal.json",
  },
  {
    name: "连续登录100天",
    description: "连续登录 100 天，你已经把热爱写进了日常。",
    type: "login",
    level: 4,
    sort: 4,
    icon: "🏆",
    condition: { type: "consecutive_days", days: 100 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/app.json",
  },
  {
    name: "连续登录365天",
    description: "连续登录 365 天，这是一整年的认真生活。",
    type: "login",
    level: 5,
    sort: 5,
    icon: "👑",
    condition: { type: "consecutive_days", days: 365 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/home.json",
  },
  {
    name: "累计登录10天",
    description: "累计登录 10 天，每一次回来都值得被记住。",
    type: "login",
    level: 1,
    sort: 6,
    icon: "📅",
    condition: { type: "total_days", days: 10 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/message.json",
  },
  {
    name: "累计登录50天",
    description: "累计登录 50 天，成长已经留下清晰轨迹。",
    type: "login",
    level: 2,
    sort: 7,
    icon: "🎯",
    condition: { type: "total_days", days: 50 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/personal.json",
  },
  {
    name: "累计登录100天",
    description: "累计登录 100 天，你的记录值得被点亮。",
    type: "login",
    level: 3,
    sort: 8,
    icon: "🗓️",
    condition: { type: "total_days", days: 100 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/app.json",
  },
  {
    name: "累计登录365天",
    description: "累计登录 365 天，把普通日常活成了长期主义。",
    type: "login",
    level: 4,
    sort: 9,
    icon: "🎖️",
    condition: { type: "total_days", days: 365 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/home.json",
  },
  {
    name: "累计登录1000天",
    description: "累计登录 1000 天，这份陪伴已经足够珍贵。",
    type: "login",
    level: 5,
    sort: 10,
    icon: "💎",
    condition: { type: "total_days", days: 1000 },
    iconPath: "/static/logo.png",
    animPath: "/static/icon/app.json",
  },
];

const presetMap = new Map(MEDAL_PRESETS.map((item) => [item.name, item]));

const isHttpUrl = (value) => typeof value === "string" && /^(https?:)?\/\//i.test(value.trim());
const isLocalAsset = (value) => typeof value === "string" && value.trim().startsWith("/");
const isAssetPath = (value) => isHttpUrl(value) || isLocalAsset(value);
const isJsonAsset = (value) => typeof value === "string" && /\.json($|\?)/i.test(value.trim());
const isDefaultAsset = (value) => typeof value === "string" && value.trim().startsWith("/static/");

const pickFirst = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return "";
};

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(String(value));

const toPathname = (value) => {
  if (typeof value !== "string" || !value.trim()) return "";
  const raw = value.trim();

  if (raw.startsWith("/")) {
    return raw;
  }

  if (!isHttpUrl(raw)) {
    return "";
  }

  try {
    return decodeURIComponent(new URL(raw).pathname || "");
  } catch (error) {
    return "";
  }
};

const resolveLocalAssetPath = (value) => {
  const pathname = toPathname(value);
  if (!pathname) return "";

  if (pathname.startsWith("/static/")) {
    return path.resolve(APP_STATIC_ROOT, pathname.slice("/static/".length));
  }

  const relativeUploadPath = pathname
    .replace(/^\/+/, "")
    .replace(/^uploads\//i, "");
  const targetPath = path.resolve(UPLOAD_ROOT, relativeUploadPath);
  return targetPath.startsWith(UPLOAD_ROOT) ? targetPath : "";
};

const assetExists = (value) => {
  if (!isAssetPath(value)) return false;

  if (isHttpUrl(value)) {
    try {
      const url = new URL(value);
      if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  const localPath = resolveLocalAssetPath(value);
  return Boolean(localPath && fs.existsSync(localPath));
};

const getConditionSummary = (condition = {}) => {
  const type = String(condition?.type || "");
  const days = Number(condition?.days || 0);

  if (type === "first_login") return "首次登录";
  if (type === "consecutive_days" && days > 0) return `连续登录 ${days} 天`;
  if (type === "total_days" && days > 0) return `累计登录 ${days} 天`;
  return "自定义条件";
};

const getPresetVisual = (medal = {}) => presetMap.get(String(medal.name || "").trim()) || null;

const pickRenderableAsset = (candidate, fallback) => {
  if (isAssetPath(candidate) && assetExists(candidate)) {
    return candidate.trim();
  }
  return fallback;
};

const getMedalVisual = (medal = {}) => {
  const preset = getPresetVisual(medal);
  const iconCandidate = pickFirst(
    isAssetPath(medal.iconUrl) ? medal.iconUrl : "",
    isAssetPath(medal.iconPath) ? medal.iconPath : "",
    isAssetPath(medal.icon) ? medal.icon : "",
  );
  const lottieCandidate = pickFirst(
    isAssetPath(medal.lottieUrl) ? medal.lottieUrl : "",
    isAssetPath(medal.animPath) ? medal.animPath : "",
  );

  const presetIcon = preset?.iconPath || DEFAULT_VISUAL.iconPath;
  const presetLottie = preset?.animPath || "";

  const iconPath = pickRenderableAsset(iconCandidate, pickRenderableAsset(presetIcon, DEFAULT_VISUAL.iconPath));
  const animPath = pickRenderableAsset(
    isJsonAsset(lottieCandidate) ? lottieCandidate : "",
    presetLottie ? pickRenderableAsset(presetLottie, DEFAULT_VISUAL.animPath) : "",
  );

  return {
    iconPath,
    animPath: animPath || "",
  };
};

const describeMedalVisual = (medal = {}) => {
  const visual = getMedalVisual(medal);
  const rawIconUrl = pickFirst(
    isAssetPath(medal.iconUrl) ? medal.iconUrl : "",
    isAssetPath(medal.iconPath) ? medal.iconPath : "",
    isAssetPath(medal.icon) ? medal.icon : "",
  );
  const rawLottieUrl = pickFirst(
    isAssetPath(medal.lottieUrl) ? medal.lottieUrl : "",
    isAssetPath(medal.animPath) ? medal.animPath : "",
  );

  const hasExplicitIcon = isAssetPath(rawIconUrl) && assetExists(rawIconUrl);
  const hasExplicitLottie = isJsonAsset(rawLottieUrl) && assetExists(rawLottieUrl);
  const hasIcon = isAssetPath(visual.iconPath) && assetExists(visual.iconPath);
  const hasLottie = Boolean(visual.animPath) && isJsonAsset(visual.animPath) && assetExists(visual.animPath);

  const visualType = hasExplicitLottie
    ? "lottie"
    : hasExplicitIcon
      ? "icon"
      : hasLottie
        ? "lottie"
        : hasIcon
          ? "icon"
          : "emoji";

  const previewUrl =
    visualType === "lottie"
      ? visual.animPath
      : visualType === "icon"
        ? visual.iconPath
        : "";

  const iconPreview = hasIcon ? visual.iconPath : DEFAULT_VISUAL.iconPath;
  const usesFallbackVisual =
    (Boolean(rawIconUrl) && !hasExplicitIcon && visual.iconPath !== rawIconUrl) ||
    (Boolean(rawLottieUrl) && !hasExplicitLottie && visual.animPath !== rawLottieUrl);
  const isRenderable =
    visualType === "emoji"
      ? Boolean(String(medal.icon || "").trim())
      : Boolean(previewUrl && assetExists(previewUrl));
  const explicitCustomAsset =
    (hasExplicitIcon && !isDefaultAsset(rawIconUrl)) ||
    (hasExplicitLottie && !isDefaultAsset(rawLottieUrl));
  const isDefault =
    !explicitCustomAsset &&
    (isDefaultAsset(visual.iconPath) || isDefaultAsset(visual.animPath));

  return {
    iconPath: visual.iconPath,
    animPath: visual.animPath,
    visualType,
    previewUrl,
    iconPreview,
    hasIcon,
    hasLottie,
    isRenderable,
    isDefault,
    usesFallbackVisual,
    resourceState: !isRenderable ? "missing" : usesFallbackVisual ? "fallback" : "ready",
  };
};

const normalizeMedalDefinition = (medal = {}) => {
  const raw = medal?.toJSON ? medal.toJSON() : medal;
  const visualMeta = describeMedalVisual(raw);

  return {
    ...raw,
    id: raw.id || raw._id?.toString?.() || "",
    icon: pickFirst(raw.icon, "🏅"),
    iconUrl: pickFirst(raw.iconUrl, visualMeta.iconPath),
    lottieUrl: pickFirst(raw.lottieUrl, visualMeta.animPath),
    iconPath: visualMeta.iconPath,
    animPath: visualMeta.animPath,
    conditionSummary: getConditionSummary(raw.condition || {}),
    ...visualMeta,
  };
};

const normalizeMedalRecord = (record) => {
  const medal = record?.medalId?.toJSON ? record.medalId.toJSON() : record?.medalId;
  if (!medal) return null;

  return {
    ...normalizeMedalDefinition(medal),
    relationId: record.id || record._id?.toString?.() || "",
    awardedAt: record.obtainedAt || record.createdAt || null,
    obtainedDate: record.obtainedAt || record.createdAt || null,
    reason: record.reason || "",
    obtained: true,
  };
};

const initDefaultMedals = async () => {
  for (const preset of MEDAL_PRESETS) {
    const existing = await Medal.findOne({ name: preset.name });
    const defaultIcon = preset.iconPath || DEFAULT_VISUAL.iconPath;
    const defaultLottie = preset.animPath || DEFAULT_VISUAL.animPath;

    if (!existing) {
      await Medal.create({
        ...preset,
        iconUrl: defaultIcon,
        lottieUrl: defaultLottie,
        enabled: true,
      });
      continue;
    }

    existing.description = existing.description || preset.description;
    existing.type = existing.type || preset.type;
    existing.level = existing.level || preset.level;
    existing.sort = existing.sort ?? preset.sort;
    existing.condition =
      existing.condition && Object.keys(existing.condition).length
        ? existing.condition
        : preset.condition;
    existing.icon = existing.icon || preset.icon;
    existing.iconUrl = pickRenderableAsset(existing.iconUrl, defaultIcon);
    existing.lottieUrl = pickRenderableAsset(
      isJsonAsset(existing.lottieUrl) ? existing.lottieUrl : "",
      defaultLottie,
    );
    if (existing.enabled === undefined) {
      existing.enabled = true;
    }
    await existing.save();
  }
};

const hasMedal = async (userId, medalId) => {
  const userMedal = await UserMedal.findOne({
    userId: toObjectId(userId),
    medalId: toObjectId(medalId),
  });
  return Boolean(userMedal);
};

const awardMedal = async (userId, medalId, reason) => {
  const normalizedUserId = toObjectId(userId);
  const normalizedMedalId = toObjectId(medalId);

  if (await hasMedal(normalizedUserId, normalizedMedalId)) {
    return {
      success: false,
      message: "用户已获得该勋章",
    };
  }

  const userMedal = await UserMedal.create({
    userId: normalizedUserId,
    medalId: normalizedMedalId,
    reason,
  });

  return {
    success: true,
    userMedal,
  };
};

const awardByCondition = async (userId, filter, reason, awardedMedals) => {
  const medal = await Medal.findOne(filter);
  if (!medal) return;

  const result = await awardMedal(userId, medal._id, reason);
  if (result.success) {
    awardedMedals.push({
      medal: normalizeMedalDefinition(medal),
      result,
    });
  }
};

const checkAndAwardMedals = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "用户不存在",
      };
    }

    const awardedMedals = [];

    if ((user.totalLoginDays || 0) >= 1) {
      await awardByCondition(
        userId,
        { "condition.type": "first_login" },
        "首次登录获得",
        awardedMedals,
      );
    }

    const streakMilestones = {
      "7_days_streak": 7,
      "30_days_streak": 30,
      "100_days_streak": 100,
      "365_days_streak": 365,
    };

    for (const key of checkLoginStreak(user.consecutiveLoginDays || 0)) {
      const days = streakMilestones[key];
      if (!days) continue;
      await awardByCondition(
        userId,
        { "condition.type": "consecutive_days", "condition.days": days },
        `连续登录 ${days} 天获得`,
        awardedMedals,
      );
    }

    const totalMilestones = {
      "10_days_total": 10,
      "50_days_total": 50,
      "100_days_total": 100,
      "365_days_total": 365,
      "1000_days_total": 1000,
    };

    for (const key of checkTotalLoginDays(user.totalLoginDays || 0)) {
      const days = totalMilestones[key];
      if (!days) continue;
      await awardByCondition(
        userId,
        { "condition.type": "total_days", "condition.days": days },
        `累计登录 ${days} 天获得`,
        awardedMedals,
      );
    }

    return {
      success: true,
      awardedMedals,
    };
  } catch (error) {
    console.error("检查并颁发勋章失败:", error);
    return {
      success: false,
      message: error.message,
    };
  }
};

const getUserMedals = async (userId) => {
  try {
    const userMedals = await UserMedal.find({
      userId: toObjectId(userId),
      status: "active",
    })
      .populate("medalId")
      .sort({ obtainedAt: -1 });

    return userMedals.map(normalizeMedalRecord).filter(Boolean);
  } catch (error) {
    console.error("获取用户勋章失败:", error);
    return [];
  }
};

const getAllMedals = async () => {
  try {
    const medals = await Medal.find({ enabled: true }).sort({
      sort: 1,
      level: 1,
      createdAt: 1,
    });
    return medals.map(normalizeMedalDefinition);
  } catch (error) {
    console.error("获取全部勋章失败:", error);
    return [];
  }
};

module.exports = {
  MEDAL_PRESETS,
  initDefaultMedals,
  checkAndAwardMedals,
  getUserMedals,
  getAllMedals,
  awardMedal,
  hasMedal,
  getMedalVisual,
  describeMedalVisual,
  getConditionSummary,
  normalizeMedalDefinition,
  normalizeMedalRecord,
};
