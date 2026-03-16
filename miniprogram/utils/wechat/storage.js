/**
 * 统一执行本地缓存操作，避免每个方法重复 try/catch。
 * @param {string} actionName - 操作名称，用于日志定位。
 * @param {string} key - 缓存键名。
 * @param {Function} executor - 实际执行函数。
 * @param {*} fallback - 失败时的兜底返回值。
 * @returns {*} 操作结果。
 */
function runStorageOperation(actionName, key, executor, fallback) {
  try {
    return executor()
  } catch (error) {
    console.error(`[storage:${actionName}]`, key, error)
    return fallback
  }
}

/**
 * 判断缓存值是否缺失。
 * @param {*} value - 读取到的缓存值。
 * @returns {boolean} 是否视为缺失值。
 */
function isMissingStorageValue(value) {
  return value === '' || typeof value === 'undefined'
}

/**
 * 读取本地缓存。
 * @param {string} key - 缓存键名。
 * @param {*} fallback - 未命中或读取失败时的默认值。
 * @returns {*} 缓存值或默认值。
 */
function getStorage(key, fallback) {
  return runStorageOperation('get', key, () => {
    const value = wx.getStorageSync(key)
    return isMissingStorageValue(value) ? fallback : value
  }, fallback)
}

/**
 * 写入本地缓存。
 * @param {string} key - 缓存键名。
 * @param {*} value - 需要写入的值。
 * @returns {boolean} 是否写入成功。
 */
function setStorage(key, value) {
  return runStorageOperation('set', key, () => {
    wx.setStorageSync(key, value)
    return true
  }, false)
}

/**
 * 删除本地缓存。
 * @param {string} key - 缓存键名。
 * @returns {boolean} 是否删除成功。
 */
function removeStorage(key) {
  return runStorageOperation('remove', key, () => {
    wx.removeStorageSync(key)
    return true
  }, false)
}

module.exports = {
  getStorage,
  setStorage,
  removeStorage
}
