// 日期时间工具函数

/**
 * 格式化日期时间为 yyyy-mm-dd HH:MM:SS 格式
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
  if (!date) {
    return '';
  }
  
  // 确保是日期对象
  const d = new Date(date);
  
  // 获取年月日时分秒
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // 组合成格式化字符串
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期为 yyyy-mm-dd 格式
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) {
    return '';
  }
  
  // 确保是日期对象
  const d = new Date(date);
  
  // 获取年月日
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  // 组合成格式化字符串
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为 HH:MM:SS 格式
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(date) {
  if (!date) {
    return '';
  }
  
  // 确保是日期对象
  const d = new Date(date);
  
  // 获取时分秒
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  // 组合成格式化字符串
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 获取当前日期时间的格式化字符串
 * @returns {string} 当前日期时间的格式化字符串
 */
function getCurrentDateTime() {
  return formatDateTime(new Date());
}

/**
 * 获取当前日期的格式化字符串
 * @returns {string} 当前日期的格式化字符串
 */
function getCurrentDate() {
  return formatDate(new Date());
}

/**
 * 获取当前时间的格式化字符串
 * @returns {string} 当前时间的格式化字符串
 */
function getCurrentTime() {
  return formatTime(new Date());
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string|number} date1 - 第一个日期
 * @param {Date|string|number} date2 - 第二个日期
 * @returns {number} 天数差
 */
function getDaysDiff(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * 向日期添加指定天数
 * @param {Date|string|number} date - 基础日期
 * @param {number} days - 要添加的天数
 * @returns {Date} 新的日期对象
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

module.exports = {
  formatDateTime,
  formatDate,
  formatTime,
  getCurrentDateTime,
  getCurrentDate,
  getCurrentTime,
  getDaysDiff,
  addDays
};