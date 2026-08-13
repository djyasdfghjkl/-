const errorConfig = {
  common: {
    serverError: {
      success: false,
      message: "服务器内部错误",
      tip: "请稍后重试，如问题持续存在，请联系系统管理员",
    },
    badRequest: {
      success: false,
      message: "请求参数错误",
      tip: "请检查请求参数是否正确",
    },
    notFound: {
      success: false,
      message: "请求的资源不存在",
      tip: "请检查请求路径是否正确",
    },
    forbidden: {
      success: false,
      message: "权限不足",
      tip: "您没有权限执行此操作",
    },
    unauthenticated: {
      success: false,
      message: "未登录",
      tip: "请先登录",
    },
  },
  user: {
    emailExists: {
      success: false,
      message: "邮箱已被注册",
      tip: "请使用其他邮箱注册",
    },
    emailNotExists: {
      success: false,
      message: "邮箱不存在",
      tip: "请检查邮箱是否正确",
    },
    passwordIncorrect: {
      success: false,
      message: "邮箱或密码错误",
      tip: "请检查账号信息后重试",
    },
    userNotFound: {
      success: false,
      message: "用户不存在",
      tip: "请检查用户信息是否正确",
    },
    accountInactive: {
      success: false,
      message: "账号已被停用",
      tip: "请联系系统管理员",
    },
    superAdminCannotBeModified: {
      success: false,
      message: "超级管理员身份不能被修改",
      tip: "请使用其他账号执行此操作",
    },
  },
  auth: {
    tokenExpired: {
      success: false,
      message: "未登录",
      tip: "登录已过期，请重新登录",
    },
    tokenInvalid: {
      success: false,
      message: "未登录",
      tip: "登录凭证无效，请重新登录",
    },
    tokenMissing: {
      success: false,
      message: "未登录",
      tip: "请在请求头中添加 Authorization 字段",
    },
    verificationFailed: {
      success: false,
      message: "未登录",
      tip: "身份校验失败，请重新登录",
    },
  },
  redeem: {
    codeNotFound: {
      success: false,
      message: "兑换码不存在",
      tip: "请检查兑换码是否正确",
    },
    codeExpired: {
      success: false,
      message: "兑换码已过期",
      tip: "请使用未过期的兑换码",
    },
    codeUsed: {
      success: false,
      message: "兑换码已被使用",
      tip: "请使用其他兑换码",
    },
    generateFailed: {
      success: false,
      message: "生成兑换码失败",
      tip: "请稍后重试",
    },
  },
  recharge: {
    amountInvalid: {
      success: false,
      message: "充值金额无效",
      tip: "充值金额必须大于 0",
    },
    durationInvalid: {
      success: false,
      message: "充值天数无效",
      tip: "充值天数必须大于 0",
    },
    rechargeFailed: {
      success: false,
      message: "充值失败",
      tip: "请稍后重试",
    },
  },
  email: {
    sendFailed: {
      success: false,
      message: "验证码发送失败",
      tip: "请检查邮箱地址是否正确，或稍后重试",
    },
    codeExpired: {
      success: false,
      message: "验证码已过期",
      tip: "请重新获取验证码",
    },
    codeIncorrect: {
      success: false,
      message: "验证码错误",
      tip: "请检查验证码是否正确",
    },
    codeUsed: {
      success: false,
      message: "验证码已被使用",
      tip: "请重新获取验证码",
    },
  },
  database: {
    connectionFailed: {
      success: false,
      message: "数据库连接失败",
      tip: "请稍后重试",
    },
    operationFailed: {
      success: false,
      message: "数据库操作失败",
      tip: "请稍后重试",
    },
    duplicateKey: {
      success: false,
      message: "数据已存在",
      tip: "请检查输入内容是否重复",
    },
  },
  admin: {
    createFailed: {
      success: false,
      message: "创建管理员失败",
      tip: "请检查输入信息是否正确",
    },
    updateFailed: {
      success: false,
      message: "更新管理员失败",
      tip: "请检查输入信息是否正确",
    },
    deleteFailed: {
      success: false,
      message: "删除管理员失败",
      tip: "请检查管理员 ID 是否正确",
    },
    notFound: {
      success: false,
      message: "管理员不存在",
      tip: "请检查管理员 ID 是否正确",
    },
  },
};

const getError = (errorPath, customMessage = null) => {
  const parts = String(errorPath || "").split(".");
  let current = errorConfig;

  for (const part of parts) {
    if (current && Object.prototype.hasOwnProperty.call(current, part)) {
      current = current[part];
    } else {
      return errorConfig.common.serverError;
    }
  }

  if (customMessage) {
    return {
      ...current,
      message: customMessage,
    };
  }

  return current;
};

module.exports = {
  errorConfig,
  getError,
};
