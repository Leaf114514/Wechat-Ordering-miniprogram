const config = require('../config/index')
const { cloud } = require('../utils/wechat/index')

/**
 * 获取全局 App 实例。
 * @returns {Object|null} App 实例。
 */
function getAppInstance() {
  try {
    return getApp()
  } catch (error) {
    return null
  }
}

/**
 * 判断当前是否启用 Mock 数据。
 * @returns {boolean} 是否启用 Mock。
 */
function shouldUseMock() {
  const app = getAppInstance()
  return app ? app.globalData.useMockData : config.useMockData
}

/**
 * 判断云开发是否可用。
 * @returns {boolean} 云开发可用状态。
 */
function isCloudReady() {
  const app = getAppInstance()
  return Boolean(app && app.globalData.cloudReady && cloud.isSupported())
}

/**
 * 获取云数据库实例。
 * @returns {Object} 数据库对象。
 */
function getDatabase() {
  if (!isCloudReady()) {
    throw new Error('当前未配置云开发环境，请先填写 cloudEnvId')
  }

  return cloud.getDatabase()
}

/**
 * 调用云函数。
 * @param {string} name - 云函数名称。
 * @param {Object} data - 云函数参数。
 * @returns {Promise<Object>} 云函数结果。
 */
async function callCloudFunction(name, data) {
  if (!isCloudReady()) {
    throw new Error('云函数不可用，请先初始化云开发环境')
  }

  return cloud.callFunction(name, data)
}

module.exports = {
  getAppInstance,
  shouldUseMock,
  isCloudReady,
  getDatabase,
  callCloudFunction
}
