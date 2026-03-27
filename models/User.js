const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  uuid: {
    type: String,
    required: true,
    unique: true,
    default: function () {
      return mongoose.Types.ObjectId().toString();
    },
  },
  username: {
    type: String,
    unique: true,
    trim: true,
  },
  nickname: {
    type: String,
    default: function () {
      return this.username || (this.email ? this.email.split("@")[0] : "用户");
    },
    trim: true,
  },
  avatar: {
    type: String,
    default:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT0HNMljHEj-lzogm1ayQ6BZ8yEVcOuNmPAnw&s",
  },
  gender: {
    type: Number,
    enum: [0, 1, 2], // 0=未知，1=男，2=女
    default: 0,
  },
  birthday: {
    type: Date,
  },
  bio: {
    type: String,
    default: "",
    trim: true,
  },
  city: {
    type: String,
    maxlength: 100,
    default: "",
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  phone_verified: {
    type: Boolean,
    default: false,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  email_verified: {
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
  },
  wx_openid: {
    type: String,
    unique: true,
    sparse: true,
  },
  wx_unionid: {
    type: String,
  },
  qq_openid: {
    type: String,
    unique: true,
    sparse: true,
  },
  douyin_openid: {
    type: String,
    unique: true,
    sparse: true,
  },
  kuaishou_openid: {
    type: String,
    unique: true,
    sparse: true,
  },
  alipay_openid: {
    type: String,
    unique: true,
    sparse: true,
  },
  status: {
    type: Number,
    enum: [0, 1, 2], // 0=禁用，1=正常，2=冻结
    default: 1,
  },
  role: {
    type: Number,
    enum: [0, 1, 2, 3, 4], // 0=普通用户，1=VIP，2=SVIP，3=管理员，4=超级管理员
    default: 0,
  },
  vip_expire: {
    type: Date,
    default: null,
  },
  diary_count: {
    type: Number,
    default: 0,
  },
  word_count: {
    type: Number,
    default: 0,
  },
  like_count: {
    type: Number,
    default: 0,
  },
  follower_count: {
    type: Number,
    default: 0,
  },
  following_count: {
    type: Number,
    default: 0,
  },
  settings: {
    type: Object,
    default: {
      theme: "base",
      font_size: "medium",
      notify_comment: true,
      notify_like: true,
      handwriting_font: false,
      auto_indent: true,
    },
  },
  medals: {
    type: Array,
    default: [],
  },
  transfer_percent: {
    type: Number,
    default: 100, // 默认100%
    min: 0,
    max: 200,
  },
  special_medals: {
    type: Array,
    default: [],
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
  },
  user_level: {
    type: Number,
    default: 1,
    min: 1,
  },
  last_login_at: {
    type: Date,
    default: null,
  },
  last_login_ip: {
    type: String,
    default: null,
  },
  // 保留原有字段以保持兼容性
  vipExpireDate: {
    type: Date,
    default: null,
  },
  svipExpireDate: {
    type: Date,
    default: null,
  },
  balance: {
    type: Number,
    default: 0,
  },
  totalLoginDays: {
    type: Number,
    default: 0,
  },
  consecutiveLoginDays: {
    type: Number,
    default: 0,
  },
  lastLoginDate: {
    type: Date,
    default: null,
  },
  loginCount: {
    type: Number,
    default: 0,
  },
  loginStreakResetDate: {
    type: Date,
    default: null,
  },
  signature: {
    type: String,
    default: "",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// 密码加密
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  this.updatedAt = Date.now();
  next();
});

// 验证密码
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 检查是否是VIP
UserSchema.methods.isVip = function () {
  return (
    (this.role === 1 || this.role === 2) &&
    (this.vip_expire || this.vipExpireDate) &&
    (this.vip_expire > new Date() || this.vipExpireDate > new Date())
  );
};

// 检查是否是SVIP
UserSchema.methods.isSvip = function () {
  return (
    this.role === 2 && this.svipExpireDate && this.svipExpireDate > new Date()
  );
};

module.exports = mongoose.model("User", UserSchema);
