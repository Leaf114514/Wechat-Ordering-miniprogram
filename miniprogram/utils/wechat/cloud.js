/**
 * 判断当前运行环境是否支持云开发。
 * @returns {boolean} 是否支持云开发。
 */
function isSupported() {
  return Boolean(wx && wx.cloud)
}

/**
 * 初始化云开发能力。
 * @param {Object} options - wx.cloud.init 配置。
 * @returns {boolean} 是否初始化成功。
 */
function init(options) {
  if (!isSupported()) {
    throw new Error('当前基础库不支持云开发能力')
  }

  wx.cloud.init(options || {})
  return true
}

/**
 * 获取云数据库实例。
 * @returns {Object} 云数据库实例。
 */
function getDatabase() {
  if (!isSupported()) {
    throw new Error('当前环境未启用云开发能力')
  }

  return wx.cloud.database()
}

/**
 * 调用云函数。
 * @param {string} name - 云函数名称。
 * @param {Object} data - 调用参数。
 * @returns {Promise<Object>} 云函数结果。
 */
function callFunction(name, data) {
  if (!isSupported()) {
    return Promise.reject(new Error('当前环境未启用云开发能力'))
  }

  return wx.cloud.callFunction({
    name,
    data
  })
}

module.exports = {
  init,
  getDatabase,
  callFunction,
  isSupported
}
