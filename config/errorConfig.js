// 错误配置文件
// 定义各种错误类型及其对应的错误信息

const errorConfig = {
  // 通用错误
  common: {
    serverError: {
      success: false,
      message: "服务器内部错误",
      tip: "请稍后重试，如果问题持续存在，请联系系统管理员",
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
      message: "未认证",
      tip: "请先登录",
    },
  },

  // 用户相关错误
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
      message: "密码错误",
      tip: "请检查密码是否正确",
    },
    userNotFound: {
      success: false,
      message: "用户不存在",
      tip: "请检查用户ID是否正确",
    },
    accountInactive: {
      success: false,
      message: "账号已被停用",
      tip: "请联系系统管理员",
    },
    superAdminCannotBeModified: {
      success: false,
      message: "超级管理员身份不能被更改",
      tip: "超级管理员身份一旦确定，无法更改",
    },
  },

  // 认证相关错误
  auth: {
    tokenExpired: {
      success: false,
      message: "Token过期",
      tip: "请重新登录获取新的Token",
    },
    tokenInvalid: {
      success: false,
      message: "Token无效",
      tip: "请检查Token是否正确",
    },
    tokenMissing: {
      success: false,
      message: "缺少Token",
      tip: "请在请求头中添加Authorization字段",
    },
    verificationFailed: {
      success: false,
      message: "验证失败",
      tip: "请检查验证信息是否正确",
    },
  },

  // 兑换码相关错误
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
      tip: "请使用未使用的兑换码",
    },
    generateFailed: {
      success: false,
      message: "生成兑换码失败",
      tip: "请稍后重试",
    },
  },

  // 充值相关错误
  recharge: {
    amountInvalid: {
      success: false,
      message: "充值金额无效",
      tip: "充值金额必须大于0",
    },
    durationInvalid: {
      success: false,
      message: "充值天数无效",
      tip: "充值天数必须大于0",
    },
    rechargeFailed: {
      success: false,
      message: "充值失败",
      tip: "请稍后重试",
    },
  },

  // 邮箱验证码相关错误
  email: {
    sendFailed: {
      success: false,
      message: "发送验证码失败",
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

  // 数据库相关错误
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
      tip: "请检查输入数据是否重复",
    },
  },

  // 管理员相关错误
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
      tip: "请检查管理员ID是否正确",
    },
    notFound: {
      success: false,
      message: "管理员不存在",
      tip: "请检查管理员ID是否正确",
    },
  },
};

// 获取错误信息的函数
const getError = (errorPath, customMessage = null) => {
  // 分割错误路径
  const pathParts = errorPath.split(".");
  let errorInfo = errorConfig;

  // 遍历路径获取错误信息
  for (const part of pathParts) {
    if (errorInfo[part]) {
      errorInfo = errorInfo[part];
    } else {
      // 如果路径不存在，返回通用错误
      return errorConfig.common.serverError;
    }
  }

  // 如果提供了自定义消息，使用自定义消息
  if (customMessage) {
    return {
      ...errorInfo,
      message: customMessage,
    };
  }

  return errorInfo;
};

module.exports = {
  errorConfig,
  getError,
};
