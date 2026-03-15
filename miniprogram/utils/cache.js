/**
 * 从本地缓存中读取数据。
 * @param {string} key - 缓存键名。
 * @param {*} fallback - 默认值。
 * @returns {*} 缓存值。
 */
function getStorage(key, fallback) {
  try {
    const value = wx.getStorageSync(key)
    return value === '' || typeof value === 'undefined' ? fallback : value
  } catch (error) {
    console.error('[缓存读取失败]', key, error)
    return fallback
  }
}

/**
 * 向本地缓存写入数据。
 * @param {string} key - 缓存键名。
 * @param {*} value - 待写入数据。
 */
function setStorage(key, value) {
  try {
    wx.setStorageSync(key, value)
  } catch (error) {
    console.error('[缓存写入失败]', key, error)
  }
}

/**
 * 删除本地缓存数据。
 * @param {string} key - 缓存键名。
 */
function removeStorage(key) {
  try {
    wx.removeStorageSync(key)
  } catch (error) {
    console.error('[缓存移除失败]', key, error)
  }
}

module.exports = {
  getStorage,
  setStorage,
  removeStorage
}
